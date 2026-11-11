"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var BulkMessageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BulkMessageService = void 0;
exports.resolveFinalBatchStatus = resolveFinalBatchStatus;
exports.sanitizeBatchError = sanitizeBatchError;
exports.resolveMaxConcurrentBatches = resolveMaxConcurrentBatches;
const common_1 = require("@nestjs/common");
const logger_service_1 = require("../../common/services/logger.service");
const shutdown_service_1 = require("../../common/services/shutdown.service");
const config_1 = require("@nestjs/config");
const session_write_scope_1 = require("../../common/utils/session-write-scope");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const crypto_1 = require("crypto");
const promises_1 = require("node:timers/promises");
const message_batch_entity_1 = require("./entities/message-batch.entity");
const send_message_dto_1 = require("./dto/send-message.dto");
const is_mention_wid_validator_1 = require("./dto/is-mention-wid.validator");
const media_url_1 = require("../../common/media/media-url");
const message_entity_1 = require("./entities/message.entity");
const engine_registry_service_1 = require("../../engine/engine-registry.service");
const message_service_1 = require("./message.service");
const send_pacing_service_1 = require("./send-pacing.service");
const session_ownership_service_1 = require("../session/session-ownership.service");
const hooks_1 = require("../../core/hooks");
const media_cap_util_1 = require("./media-cap.util");
const batch_media_util_1 = require("./batch-media.util");
const ssrf_guard_1 = require("../../common/security/ssrf-guard");
const template_render_1 = require("../../common/utils/template-render");
const configuration_1 = require("../../config/configuration");
const engine_not_ready_error_1 = require("../../common/errors/engine-not-ready.error");
const db_errors_1 = require("../../common/utils/db-errors");
function messageTypeOf(type, content) {
    return type === 'audio' && content.audio?.ptt ? 'voice' : type;
}
function resolveFinalBatchStatus(cancelled, stoppedOnError, progress) {
    if (cancelled)
        return message_batch_entity_1.BatchStatus.CANCELLED;
    if (stoppedOnError)
        return message_batch_entity_1.BatchStatus.FAILED;
    return progress.failed > 0 && progress.sent === 0 ? message_batch_entity_1.BatchStatus.FAILED : message_batch_entity_1.BatchStatus.COMPLETED;
}
function sanitizeBatchError(error) {
    if (error instanceof ssrf_guard_1.SsrfBlockedError) {
        return { code: 'SEND_BLOCKED', message: ssrf_guard_1.SSRF_BLOCKED_CLIENT_MESSAGE };
    }
    if ((0, send_pacing_service_1.isPacingLimitedError)(error)) {
        return { code: send_pacing_service_1.SEND_PACING_LIMITED, message: error instanceof Error ? error.message : String(error) };
    }
    return { code: 'SEND_FAILED', message: error instanceof Error ? error.message : String(error) };
}
const DEFAULT_MAX_CONCURRENT_BATCHES = 50;
function resolveMaxConcurrentBatches() {
    return (0, configuration_1.resolveNonNegativeIntEnv)(process.env.BULK_MAX_CONCURRENT_BATCHES, DEFAULT_MAX_CONCURRENT_BATCHES);
}
const ENDED_ELSEWHERE = new Set([message_batch_entity_1.BatchStatus.FAILED, message_batch_entity_1.BatchStatus.COMPLETED]);
let BulkMessageService = BulkMessageService_1 = class BulkMessageService {
    batchRepository;
    engines;
    messageService;
    hookManager;
    pacing;
    ownership;
    configService;
    shutdownService;
    logger = (0, logger_service_1.createLogger)(BulkMessageService_1.name);
    processingBatches = new Map();
    inFlightBatches = 0;
    shuttingDown = false;
    constructor(batchRepository, engines, messageService, hookManager, pacing, ownership, configService, shutdownService) {
        this.batchRepository = batchRepository;
        this.engines = engines;
        this.messageService = messageService;
        this.hookManager = hookManager;
        this.pacing = pacing;
        this.ownership = ownership;
        this.configService = configService;
        this.shutdownService = shutdownService;
    }
    onModuleInit() {
        this.ownership?.onAdoption((sessionId, manager) => this.reapProcessingBatches(sessionId, 'session taken from a lapsed node', manager), true);
    }
    async onApplicationBootstrap() {
        const unfinished = await this.batchRepository.find({
            where: { status: (0, typeorm_2.In)([message_batch_entity_1.BatchStatus.PENDING, message_batch_entity_1.BatchStatus.PROCESSING]) },
        });
        const orphaned = await this.ownedByThisNode(unfinished);
        let failed = 0;
        for (const batch of orphaned) {
            if (await this.failOrphanedBatch(batch))
                failed++;
        }
        if (failed > 0) {
            this.logger.warn(`Marked ${failed} orphaned unfinished batch(es) FAILED on startup (interrupted by a restart)`);
        }
        const skipped = unfinished.length - orphaned.length;
        if (skipped > 0) {
            this.logger.log(`Left ${skipped} unfinished batch(es) alone: their sessions are held by another node`);
        }
    }
    async onModuleDestroy() {
        this.shuttingDown = true;
        for (const id of [...this.processingBatches.keys()]) {
            try {
                const row = await this.batchRepository.findOne({ where: { id } });
                if (await this.failOrphanedBatch(row ?? { id }))
                    this.processingBatches.set(id, false);
            }
            catch (error) {
                this.logger.error(`Could not mark batch ${id} FAILED on shutdown: ${String(error)}`);
            }
        }
    }
    async failOrphanedBatch(batch, withRunState = false, repository = this.batchRepository) {
        const set = { status: message_batch_entity_1.BatchStatus.FAILED, completedAt: new Date() };
        if (batch.messages) {
            (0, batch_media_util_1.stripBatchMediaPayloads)(batch.messages);
            set.messages = batch.messages;
        }
        if (withRunState) {
            if (batch.progress)
                set.progress = batch.progress;
            if (batch.results)
                set.results = batch.results;
            if (batch.currentIndex !== undefined)
                set.currentIndex = batch.currentIndex;
        }
        const failed = await repository.update({ id: batch.id, status: (0, typeorm_2.In)([message_batch_entity_1.BatchStatus.PENDING, message_batch_entity_1.BatchStatus.PROCESSING]) }, set);
        return Boolean(failed.affected);
    }
    async reapProcessingBatches(sessionId, reason, manager) {
        const repository = manager?.getRepository(message_batch_entity_1.MessageBatch) ?? this.batchRepository;
        const unfinished = (await repository.find({
            where: { status: (0, typeorm_2.In)([message_batch_entity_1.BatchStatus.PENDING, message_batch_entity_1.BatchStatus.PROCESSING]), sessionId },
        })).filter(batch => !this.processingBatches.has(batch.id));
        let failed = 0;
        for (const batch of unfinished) {
            if (await this.failOrphanedBatch(batch, false, repository))
                failed++;
        }
        if (failed > 0) {
            this.logger.warn(`Marked ${failed} unfinished batch(es) FAILED for session ${sessionId} (${reason})`);
        }
        return failed;
    }
    async ownedByThisNode(batches) {
        if (!this.ownership || batches.length === 0)
            return batches;
        const claimable = new Set(await this.ownership.claimable([...new Set(batches.map(b => b.sessionId))]));
        return batches.filter(batch => claimable.has(batch.sessionId));
    }
    async createBatch(sessionId, dto) {
        this.engines.require(sessionId, () => new common_1.BadRequestException(`Session '${sessionId}' is not active`));
        const seenEntries = new Set();
        const messages = [];
        for (const message of dto.messages) {
            const fingerprint = (0, crypto_1.createHash)('sha256')
                .update(JSON.stringify([message.chatId, message.type, message.content, message.variables]))
                .digest('base64');
            if (seenEntries.has(fingerprint))
                continue;
            seenEntries.add(fingerprint);
            messages.push(message);
        }
        for (const { type, content } of messages) {
            this.assertContentMediaWithinCap(content);
            this.assertItemContent(type, content, true);
        }
        const batchId = dto.batchId || `batch_${(0, crypto_1.randomUUID)().split('-')[0]}`;
        if (batchId === '.' || batchId === '..') {
            throw new common_1.BadRequestException(`Batch ID '${batchId}' is not allowed`);
        }
        const lifetime = (0, session_write_scope_1.captureSessionWrites)(this.batchRepository.manager?.connection ?? this.batchRepository, sessionId);
        let handedOff = false;
        try {
            const existing = await this.batchRepository.findOne({ where: { batchId, sessionId } });
            if (existing) {
                throw new common_1.BadRequestException(`Batch ID '${batchId}' already exists`);
            }
            if (this.shuttingDown || this.shutdownService?.isShuttingDown() === true) {
                throw new common_1.ServiceUnavailableException('The server is shutting down; retry the batch shortly');
            }
            const maxConcurrentBatches = resolveMaxConcurrentBatches();
            if (maxConcurrentBatches > 0 && this.inFlightBatches >= maxConcurrentBatches) {
                throw new common_1.HttpException(`Too many bulk batches in progress (max ${maxConcurrentBatches}); retry shortly`, common_1.HttpStatus.TOO_MANY_REQUESTS);
            }
            const options = {
                delayBetweenMessages: dto.options?.delayBetweenMessages ?? 3000,
                randomizeDelay: dto.options?.randomizeDelay ?? true,
                stopOnError: dto.options?.stopOnError ?? false,
            };
            const progress = {
                total: messages.length,
                sent: 0,
                failed: 0,
                pending: messages.length,
                cancelled: 0,
            };
            const batch = this.batchRepository.create({
                id: (0, crypto_1.randomUUID)(),
                batchId,
                sessionId,
                status: message_batch_entity_1.BatchStatus.PENDING,
                messages: messages,
                options,
                progress,
                results: [],
                currentIndex: 0,
            });
            this.processingBatches.set(batch.id, true);
            this.inFlightBatches++;
            try {
                await lifetime.write(() => this.batchRepository.save(batch, { transaction: false }));
            }
            catch (error) {
                this.inFlightBatches--;
                this.processingBatches.delete(batch.id);
                if ((0, db_errors_1.isUniqueViolation)(error)) {
                    throw new common_1.BadRequestException(`Batch ID '${batchId}' already exists`);
                }
                throw error;
            }
            this.logger.log(`Created batch ${batchId} with ${messages.length} messages` +
                (messages.length === dto.messages.length
                    ? ''
                    : ` (${dto.messages.length - messages.length} exact duplicate entr${dto.messages.length - messages.length === 1 ? 'y' : 'ies'} dropped)`));
            const pickup = this.processBatch(batch.id, true, lifetime).catch(err => {
                this.logger.error(`Batch ${batchId} processing error: ${String(err)}`);
            });
            handedOff = true;
            if (this.shuttingDown) {
                await pickup;
                const freed = await this.batchRepository.delete({ id: batch.id, startedAt: (0, typeorm_2.IsNull)() }).then(result => Boolean(result.affected), (error) => {
                    this.logger.error(`Could not delete unsent batch ${batchId} on shutdown: ${String(error)}`);
                    return false;
                });
                throw new common_1.ServiceUnavailableException(freed
                    ? 'The server is shutting down; retry the batch shortly'
                    : `The server is shutting down; batch '${batchId}' was not sent. Retry it shortly under a new batch ID`);
            }
            return batch;
        }
        finally {
            if (!handedOff)
                lifetime.close();
        }
    }
    async getBatchStatus(sessionId, batchId) {
        const batch = await this.batchRepository.findOne({
            where: { batchId, sessionId },
        });
        if (!batch) {
            throw new common_1.NotFoundException(`Batch '${batchId}' not found`);
        }
        return batch;
    }
    async cancelBatch(sessionId, batchId) {
        const batch = await this.batchRepository.findOne({
            where: { batchId, sessionId },
        });
        if (!batch) {
            throw new common_1.NotFoundException(`Batch '${batchId}' not found`);
        }
        if (batch.status === message_batch_entity_1.BatchStatus.COMPLETED ||
            batch.status === message_batch_entity_1.BatchStatus.CANCELLED ||
            batch.status === message_batch_entity_1.BatchStatus.FAILED) {
            throw new common_1.BadRequestException(`Batch '${batchId}' is already ${batch.status}`);
        }
        if (this.processingBatches.has(batch.id))
            this.processingBatches.set(batch.id, false);
        batch.status = message_batch_entity_1.BatchStatus.CANCELLED;
        batch.progress.cancelled = batch.progress.pending;
        batch.progress.pending = 0;
        batch.completedAt = new Date();
        (0, batch_media_util_1.stripBatchMediaPayloads)(batch.messages);
        const cancelledRows = await this.batchRepository.update({ id: batch.id, status: (0, typeorm_2.In)([message_batch_entity_1.BatchStatus.PENDING, message_batch_entity_1.BatchStatus.PROCESSING]) }, {
            status: batch.status,
            progress: batch.progress,
            completedAt: batch.completedAt,
            messages: batch.messages,
        });
        if (!cancelledRows.affected) {
            const fresh = await this.batchRepository.findOne({ where: { id: batch.id }, select: { status: true } });
            throw new common_1.BadRequestException(`Batch '${batchId}' is already ${fresh?.status ?? 'gone'}`);
        }
        this.logger.log(`Cancelled batch ${batchId}`);
        return batch;
    }
    async processBatch(batchDbId, reserved, lifetime) {
        let batch = null;
        try {
            batch = await this.batchRepository.findOne({ where: { id: batchDbId } });
            if (!batch)
                return;
            lifetime.assertCurrent();
            if (this.processingBatches.get(batch.id) === false || batch.status === message_batch_entity_1.BatchStatus.CANCELLED) {
                this.logger.log(`Batch ${batch.batchId} was cancelled before processing started; nothing was sent`);
                return;
            }
            if (this.shuttingDown) {
                await lifetime.write(() => this.failOrphanedBatch(batch));
                this.logger.warn(`Batch ${batch.batchId} was failed before processing started: shutting down`);
                return;
            }
            this.processingBatches.set(batch.id, true);
            await this.executeBatch(batch, lifetime);
        }
        catch (error) {
            lifetime.assertCurrent();
            await lifetime
                .write(() => this.failOrphanedBatch(batch ?? { id: batchDbId }, true))
                .catch((failError) => {
                this.logger.error(`Could not mark batch ${batchDbId} FAILED after its run threw: ${String(failError)}`);
            });
            throw error;
        }
        finally {
            if (reserved)
                this.inFlightBatches--;
            this.processingBatches.delete(batchDbId);
            lifetime.close();
        }
    }
    async executeBatch(batch, lifetime) {
        if (!(await lifetime.write(() => this.markBatchProcessing(batch))))
            return;
        lifetime.assertCurrent();
        if (!this.engines.get(batch.sessionId)) {
            await lifetime.write(() => this.failBatchWithoutEngine(batch));
            return;
        }
        const results = batch.results || [];
        const state = { results, stoppedOnError: false, cancelledByDb: false, endedElsewhere: false };
        await this.processBatchMessages(batch, state, lifetime);
        await lifetime.write(() => this.finalizeBatch(batch, state));
    }
    async markBatchProcessing(batch) {
        batch.status = message_batch_entity_1.BatchStatus.PROCESSING;
        batch.startedAt = new Date();
        const started = await this.batchRepository.update({ id: batch.id, status: message_batch_entity_1.BatchStatus.PENDING }, { status: message_batch_entity_1.BatchStatus.PROCESSING, startedAt: batch.startedAt });
        if (!started.affected) {
            this.logger.log(`Batch ${batch.batchId} was cancelled or failed before processing started; nothing was sent`);
            return false;
        }
        return true;
    }
    async failBatchWithoutEngine(batch) {
        batch.status = message_batch_entity_1.BatchStatus.FAILED;
        batch.completedAt = new Date();
        (0, batch_media_util_1.stripBatchMediaPayloads)(batch.messages);
        await this.batchRepository.update({ id: batch.id, status: (0, typeorm_2.Not)(message_batch_entity_1.BatchStatus.CANCELLED) }, {
            status: message_batch_entity_1.BatchStatus.FAILED,
            completedAt: batch.completedAt,
            messages: batch.messages,
        });
    }
    async processBatchMessages(batch, state, lifetime) {
        for (let i = batch.currentIndex; i < batch.messages.length; i++) {
            lifetime.assertCurrent();
            if (!(await this.processBatchMessage(batch, i, state, lifetime)))
                break;
        }
    }
    async processBatchMessage(batch, i, state, lifetime) {
        const { results } = state;
        if (!this.processingBatches.get(batch.id)) {
            this.logger.log(`Batch ${batch.batchId} cancelled at index ${i}`);
            return false;
        }
        const msg = batch.messages[i];
        const result = {
            chatId: msg.chatId,
            status: message_batch_entity_1.BatchMessageStatus.PENDING,
        };
        let content = msg.content;
        let blockedByPlugin = false;
        let settleAdmission;
        let engineAsked = false;
        try {
            content = this.applyVariables(msg.content, msg.variables);
            settleAdmission = await this.pacing.assertSendAllowed(batch.sessionId, msg.chatId, { untilSettled: true });
            const gate = await this.hookManager.execute('message:sending', {
                sessionId: batch.sessionId,
                input: { ...content, chatId: msg.chatId },
                type: messageTypeOf(msg.type, content),
            }, { sessionId: batch.sessionId, source: 'BulkMessageService' });
            if (!gate.continue) {
                blockedByPlugin = true;
                throw new common_1.BadRequestException('Message sending blocked by plugin');
            }
            const envelope = gate.data;
            if (envelope === undefined) {
            }
            else if (typeof envelope !== 'object' ||
                envelope === null ||
                typeof envelope.input !== 'object' ||
                envelope.input === null) {
                blockedByPlugin = true;
                throw new common_1.BadRequestException('A message:sending handler returned a payload without a usable `input`; the send was refused rather than sent unmoderated');
            }
            else {
                content = envelope.input;
            }
            this.assertContentMediaWithinCap(content);
            this.assertItemContent(msg.type, content);
            lifetime.assertCurrent();
            const engine = this.engines.get(batch.sessionId);
            if (!engine)
                throw new engine_not_ready_error_1.EngineNotReadyError();
            let messageResult;
            engineAsked = true;
            try {
                messageResult = await this.sendMessage(engine, msg.chatId, msg.type, content);
            }
            catch (engineError) {
                if ((0, send_pacing_service_1.countsTowardSendBreaker)(engineError)) {
                    this.pacing.recordSendFailure(batch.sessionId);
                }
                settleAdmission?.(!(0, send_pacing_service_1.sentNothing)(engineError));
                throw engineError;
            }
            settleAdmission?.(true);
            this.pacing.recordSendSuccess(batch.sessionId);
            result.status = message_batch_entity_1.BatchMessageStatus.SENT;
            result.messageId = messageResult.id;
            result.sentAt = new Date();
            batch.progress.sent++;
            batch.progress.pending--;
            await this.persistSentMessage(batch.sessionId, msg.chatId, msg.type, content, messageResult, lifetime);
            this.logger.debug(`Batch ${batch.batchId}: Sent message ${i + 1}/${batch.messages.length} to ${msg.chatId}`);
        }
        catch (error) {
            if (!engineAsked) {
                settleAdmission?.();
                lifetime.assertCurrent();
            }
            result.status = message_batch_entity_1.BatchMessageStatus.FAILED;
            const sanitized = sanitizeBatchError(error);
            result.error = sanitized;
            batch.progress.failed++;
            batch.progress.pending--;
            if (!blockedByPlugin && !(0, send_pacing_service_1.isPacingLimitedError)(error)) {
                await this.hookManager.execute('message:failed', {
                    sessionId: batch.sessionId,
                    error: sanitized.message,
                    input: { ...content, chatId: msg.chatId },
                    type: messageTypeOf(msg.type, content),
                }, { sessionId: batch.sessionId, source: 'BulkMessageService' });
            }
            const cause = !(error instanceof ssrf_guard_1.SsrfBlockedError) && error instanceof Error && error.cause instanceof Error
                ? ` (cause: ${error.cause.message})`
                : '';
            this.logger.warn(`Batch ${batch.batchId}: Failed message ${i + 1} to ${msg.chatId}: ${sanitized.message}${cause}`);
            if (batch.options.stopOnError) {
                batch.status = message_batch_entity_1.BatchStatus.FAILED;
                state.stoppedOnError = true;
                results.push(result);
                return false;
            }
        }
        lifetime.assertCurrent();
        results.push(result);
        batch.currentIndex = i + 1;
        batch.results = results;
        const progressSaved = await lifetime.write(() => this.batchRepository.update({ id: batch.id, status: message_batch_entity_1.BatchStatus.PROCESSING }, { progress: batch.progress, results, currentIndex: batch.currentIndex }));
        if (!progressSaved.affected) {
            await this.noteRowLeftProcessing(batch, state, `at index ${i}`);
            return false;
        }
        if (i < batch.messages.length - 1 && this.processingBatches.get(batch.id)) {
            const delay = this.calculateDelay(batch.options);
            await (0, promises_1.setTimeout)(delay);
        }
        return true;
    }
    async noteRowLeftProcessing(batch, state, where) {
        const fresh = await this.batchRepository.findOne({ where: { id: batch.id }, select: { status: true } });
        if (fresh && ENDED_ELSEWHERE.has(fresh.status)) {
            state.endedElsewhere = true;
            this.logger.warn(`Batch ${batch.batchId} was ended elsewhere (${fresh.status}) ${where}; keeping that status`);
            return;
        }
        state.cancelledByDb = true;
        this.logger.log(`Batch ${batch.batchId} cancelled (DB) ${where}`);
    }
    async keepResultsOnEndedRow(batch, results, status = message_batch_entity_1.BatchStatus.FAILED, progress = batch.progress) {
        await this.batchRepository.update({ id: batch.id, status }, { progress, results, currentIndex: batch.currentIndex });
    }
    async finalizeBatch(batch, state) {
        const { results } = state;
        if (state.endedElsewhere)
            return this.keepResultsOnEndedRow(batch, results);
        if (!state.cancelledByDb) {
            const fresh = await this.batchRepository.findOne({ where: { id: batch.id }, select: { status: true } });
            if (fresh?.status === message_batch_entity_1.BatchStatus.CANCELLED) {
                state.cancelledByDb = true;
            }
            else if (fresh && ENDED_ELSEWHERE.has(fresh.status)) {
                this.logger.warn(`Batch ${batch.batchId} was ended elsewhere (${fresh.status}); keeping that status`);
                return this.keepResultsOnEndedRow(batch, results);
            }
        }
        const cancelled = state.cancelledByDb || !this.processingBatches.get(batch.id);
        batch.status = resolveFinalBatchStatus(cancelled, state.stoppedOnError, batch.progress);
        const cancelledProgress = { ...batch.progress, cancelled: batch.progress.pending, pending: 0 };
        batch.completedAt = new Date();
        batch.results = results;
        (0, batch_media_util_1.stripBatchMediaPayloads)(batch.messages);
        const terminal = {
            status: batch.status,
            progress: cancelled ? cancelledProgress : batch.progress,
            results,
            currentIndex: batch.currentIndex,
            completedAt: batch.completedAt,
            messages: batch.messages,
        };
        if (batch.status === message_batch_entity_1.BatchStatus.CANCELLED) {
            const reconciled = await this.batchRepository.update({ id: batch.id, status: (0, typeorm_2.In)([message_batch_entity_1.BatchStatus.PROCESSING, message_batch_entity_1.BatchStatus.CANCELLED]) }, terminal);
            if (!reconciled.affected)
                await this.keepResultsOnEndedRow(batch, results);
        }
        else {
            const finalized = await this.batchRepository.update({ id: batch.id, status: message_batch_entity_1.BatchStatus.PROCESSING }, terminal);
            if (!finalized.affected) {
                const stored = await this.batchRepository.findOne({ where: { id: batch.id }, select: { status: true } });
                batch.status = stored?.status ?? message_batch_entity_1.BatchStatus.CANCELLED;
                if (batch.status === message_batch_entity_1.BatchStatus.FAILED) {
                    await this.keepResultsOnEndedRow(batch, results);
                }
                else if (batch.status === message_batch_entity_1.BatchStatus.CANCELLED && stored) {
                    await this.keepResultsOnEndedRow(batch, results, message_batch_entity_1.BatchStatus.CANCELLED, cancelledProgress);
                }
                this.logger.log(`Batch ${batch.batchId} left PROCESSING just before completion; keeping ${batch.status}`);
            }
        }
        this.logger.log(`Batch ${batch.batchId} completed: ${batch.progress.sent} sent, ${batch.progress.failed} failed`);
    }
    assertItemContent(type, content, beforeRender = false) {
        const mentions = content?.mentions;
        if (!beforeRender &&
            mentions != null &&
            (!Array.isArray(mentions) ||
                mentions.length > send_message_dto_1.MENTIONS_MAX ||
                Array.from(mentions).some(wid => typeof wid !== 'string' || wid.length > send_message_dto_1.MENTION_WID_MAX_LENGTH || !(0, is_mention_wid_validator_1.isMentionWid)(wid)))) {
            throw new common_1.BadRequestException('content.mentions must contain bounded individual WIDs');
        }
        if (type === 'text') {
            if (typeof content?.text !== 'string' || !content.text) {
                throw new common_1.BadRequestException('A text item requires a non-empty content.text');
            }
            return;
        }
        const media = content?.[type];
        if ((0, media_cap_util_1.stripBase64DataUri)(media?.base64))
            return;
        if (!media?.url) {
            throw new common_1.BadRequestException(`A ${type} item requires content.${type}.url or content.${type}.base64`);
        }
        if (!(beforeRender && typeof media.url === 'string' && media.url.includes('{')) && !(0, media_url_1.isMediaUrl)(media.url)) {
            throw new common_1.BadRequestException(`content.${type}.url must be an absolute http(s) URL`);
        }
    }
    assertContentMediaWithinCap(content) {
        for (const media of [content?.image, content?.video, content?.audio, content?.document]) {
            const base64 = (0, media_cap_util_1.stripBase64DataUri)(media?.base64);
            if (media?.base64 !== undefined && !base64 && !media.url) {
                throw new common_1.BadRequestException('Either url or base64 must be provided for bulk media');
            }
            (0, media_cap_util_1.assertBase64WithinMediaCap)(base64);
        }
    }
    applyVariables(content, variables) {
        if (!variables)
            return content;
        const maxChars = this.configService?.get('template.renderMaxChars', message_service_1.DEFAULT_TEMPLATE_RENDER_MAX_CHARS) ??
            message_service_1.DEFAULT_TEMPLATE_RENDER_MAX_CHARS;
        const replaceVars = (str) => (0, template_render_1.renderTemplate)(str, variables);
        const processValue = (value) => {
            if (typeof value === 'string') {
                return replaceVars(value);
            }
            if (Array.isArray(value)) {
                return value.map(processValue);
            }
            if (typeof value === 'object' && value !== null) {
                const result = {};
                for (const [k, v] of Object.entries(value)) {
                    result[k] = processValue(v);
                }
                return result;
            }
            return value;
        };
        const lengthOf = (str) => {
            try {
                return (0, template_render_1.renderedLength)(str, variables);
            }
            catch (error) {
                throw error instanceof template_render_1.TemplateRenderError ? new common_1.BadRequestException(error.message) : error;
            }
        };
        const hasOwnCap = /^(text|caption|(image|video|audio|document)\.base64)$/;
        const forEachOtherString = (value, visit, path = '') => {
            if (typeof value === 'string') {
                if (!hasOwnCap.test(path))
                    visit(value);
            }
            else if (Array.isArray(value)) {
                value.forEach(item => forEachOtherString(item, visit, path));
            }
            else if (typeof value === 'object' && value !== null) {
                for (const [key, item] of Object.entries(value)) {
                    forEachOtherString(item, visit, path ? `${path}.${key}` : key);
                }
            }
        };
        for (const field of ['text', 'caption']) {
            const value = content[field];
            const length = typeof value === 'string' ? lengthOf(value) : 0;
            if (length > maxChars) {
                throw new common_1.BadRequestException(`Rendered ${field} is ${length} characters, over the ${maxChars}-character limit`);
            }
        }
        for (const kind of ['image', 'video', 'audio', 'document']) {
            const base64 = content[kind]?.base64;
            if (typeof base64 === 'string')
                (0, media_cap_util_1.assertBase64LengthWithinMediaCap)(lengthOf(base64));
        }
        let added = 0;
        forEachOtherString(content, str => {
            added += Math.max(0, lengthOf(str) - str.length);
        });
        if (added > maxChars) {
            throw new common_1.BadRequestException(`Rendered content grows by ${added} characters, over the ${maxChars}-character limit`);
        }
        return processValue(content);
    }
    async persistSentMessage(sessionId, chatId, type, content, result, lifetime) {
        const media = type === 'text' ? undefined : content[type];
        const body = type === 'text' ? content.text : type === 'audio' ? undefined : content.caption;
        try {
            await this.messageService.saveOutgoingMessage(sessionId, {
                waMessageId: result.id,
                chatId,
                body: body ?? '',
                type: messageTypeOf(type, content),
                timestamp: result.timestamp,
                status: message_entity_1.MessageStatus.SENT,
                metadata: media
                    ? {
                        media: {
                            mimetype: this.mediaMimetype(type, content),
                            data: (0, media_cap_util_1.stripBase64DataUri)(media.base64) || media.url,
                            filename: media.filename,
                        },
                    }
                    : undefined,
            }, lifetime);
        }
        catch (error) {
            this.logger.warn(`Batch message persisted-after-send failed: ${String(error)}`);
        }
    }
    mediaMimetype(type, content) {
        const media = content[type];
        if (media?.mimetype)
            return media.mimetype;
        if (type === 'audio' && content.audio?.ptt)
            return 'audio/ogg; codecs=opus';
        if (!(0, media_cap_util_1.stripBase64DataUri)(media?.base64))
            return 'application/octet-stream';
        if (type === 'image')
            return 'image/jpeg';
        if (type === 'video')
            return 'video/mp4';
        if (type === 'audio')
            return 'audio/mpeg';
        return 'application/octet-stream';
    }
    sendMessage(engine, chatId, type, content) {
        switch (type) {
            case 'text':
                return content.mentions?.length
                    ? engine.sendTextMessage(chatId, content.text || '', content.mentions)
                    : engine.sendTextMessage(chatId, content.text || '');
            case 'image':
                return engine.sendImageMessage(chatId, {
                    mimetype: this.mediaMimetype(type, content),
                    data: (0, media_cap_util_1.stripBase64DataUri)(content.image?.base64) || content.image?.url || '',
                    caption: content.caption,
                    mentions: content.mentions,
                });
            case 'video':
                return engine.sendVideoMessage(chatId, {
                    mimetype: this.mediaMimetype(type, content),
                    data: (0, media_cap_util_1.stripBase64DataUri)(content.video?.base64) || content.video?.url || '',
                    caption: content.caption,
                    mentions: content.mentions,
                });
            case 'audio':
                return engine.sendAudioMessage(chatId, {
                    mimetype: this.mediaMimetype(type, content),
                    data: (0, media_cap_util_1.stripBase64DataUri)(content.audio?.base64) || content.audio?.url || '',
                    ptt: content.audio?.ptt,
                    mentions: content.mentions,
                });
            case 'document':
                return engine.sendDocumentMessage(chatId, {
                    mimetype: this.mediaMimetype(type, content),
                    data: (0, media_cap_util_1.stripBase64DataUri)(content.document?.base64) || content.document?.url || '',
                    filename: content.document?.filename,
                    caption: content.caption,
                    mentions: content.mentions,
                });
            default:
                return Promise.reject(new Error(`Unsupported message type: ${type}`));
        }
    }
    calculateDelay(options) {
        let delay = options.delayBetweenMessages;
        if (options.randomizeDelay) {
            delay += Math.random() * 2000;
        }
        return delay;
    }
};
exports.BulkMessageService = BulkMessageService;
exports.BulkMessageService = BulkMessageService = BulkMessageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(message_batch_entity_1.MessageBatch, 'data')),
    __param(5, (0, common_1.Optional)()),
    __param(6, (0, common_1.Optional)()),
    __param(7, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        engine_registry_service_1.EngineRegistry,
        message_service_1.MessageService,
        hooks_1.HookManager,
        send_pacing_service_1.SendPacingService,
        session_ownership_service_1.SessionOwnershipService,
        config_1.ConfigService,
        shutdown_service_1.ShutdownService])
], BulkMessageService);
//# sourceMappingURL=bulk-message.service.js.map