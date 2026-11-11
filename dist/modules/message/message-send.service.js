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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageSendService = exports.DEFAULT_TEMPLATE_RENDER_MAX_CHARS = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const engine_send_failure_1 = require("../../common/errors/engine-send-failure");
const engine_not_sent_error_1 = require("../../common/errors/engine-not-sent.error");
const message_metadata_1 = require("./message-metadata");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const session_service_1 = require("../session/session.service");
const message_projector_service_1 = require("../session/message-projector.service");
const engine_registry_service_1 = require("../../engine/engine-registry.service");
const media_cap_util_1 = require("./media-cap.util");
const load_remote_media_1 = require("../../common/media/load-remote-media");
const media_url_1 = require("../../common/media/media-url");
const message_entity_1 = require("./entities/message.entity");
const hooks_1 = require("../../core/hooks");
const send_pacing_service_1 = require("./send-pacing.service");
const template_service_1 = require("../template/template.service");
const template_render_1 = require("../../common/utils/template-render");
const logger_service_1 = require("../../common/services/logger.service");
const ssrf_guard_1 = require("../../common/security/ssrf-guard");
const feature_flags_1 = require("../../config/feature-flags");
const db_errors_1 = require("../../common/utils/db-errors");
const chat_media_archive_service_1 = require("../chat-media/chat-media-archive.service");
const lid_mapping_store_service_1 = require("../../engine/identity/lid-mapping-store.service");
const jid_candidates_1 = require("../../engine/identity/jid-candidates");
const session_write_scope_1 = require("../../common/utils/session-write-scope");
exports.DEFAULT_TEMPLATE_RENDER_MAX_CHARS = 64 * 1024;
function isUrlPointerMetadata(metadata) {
    const data = metadata?.media?.data;
    return typeof data === 'string' && /^https?:\/\//i.test(data);
}
let MessageSendService = class MessageSendService {
    messageRepository;
    sessionService;
    engines;
    hookManager;
    templateService;
    pacing;
    configService;
    chatMediaArchive;
    lidMappingStore;
    messageProjector;
    logger = (0, logger_service_1.createLogger)('MessageSend');
    constructor(messageRepository, sessionService, engines, hookManager, templateService, pacing, configService, chatMediaArchive, lidMappingStore, messageProjector) {
        this.messageRepository = messageRepository;
        this.sessionService = sessionService;
        this.engines = engines;
        this.hookManager = hookManager;
        this.templateService = templateService;
        this.pacing = pacing;
        this.configService = configService;
        this.chatMediaArchive = chatMediaArchive;
        this.lidMappingStore = lidMappingStore;
        this.messageProjector = messageProjector;
    }
    async sendText(sessionId, dto) {
        if (dto.linkPreview === false && dto.customLinkPreview) {
            throw new common_1.BadRequestException('linkPreview: false cannot be combined with customLinkPreview');
        }
        const { message, finalDto, engine, prepared: customPreview, } = await this.applySendingGate(sessionId, 'text', dto, finalDto => ({
            chatId: finalDto.chatId,
            body: finalDto.text,
            type: 'text',
            quotedMessageId: finalDto.quotedMessageId,
        }), (d) => this.buildCustomPreview(d.customLinkPreview));
        await this.simulateTypingIfEnabled(engine, finalDto.chatId, finalDto.text);
        let result;
        try {
            const { linkPreview, quotedMessageId } = finalDto;
            if (linkPreview !== undefined || customPreview || quotedMessageId) {
                result = await engine.sendTextMessage(finalDto.chatId, finalDto.text, finalDto.mentions, {
                    ...(linkPreview === undefined ? {} : { linkPreview }),
                    ...(customPreview ? { customPreview } : {}),
                    ...(quotedMessageId ? { quotedMessageId } : {}),
                });
            }
            else if (finalDto.mentions?.length) {
                result = await engine.sendTextMessage(finalDto.chatId, finalDto.text, finalDto.mentions);
            }
            else {
                result = await engine.sendTextMessage(finalDto.chatId, finalDto.text);
            }
        }
        catch (error) {
            return this.failSend(sessionId, 'text', message, finalDto, error);
        }
        return this.persistSentState(message, result);
    }
    async applySendingGate(sessionId, type, input, buildPending, prepare) {
        const target = input;
        const lifetime = (0, session_write_scope_1.captureSessionWrites)(this.messageRepository.manager?.connection ?? this.messageRepository, sessionId);
        let release;
        let persisted = false;
        try {
            release = await this.pacing.assertSendAllowed(sessionId, target.chatId ?? target.toChatId, {
                whilePreparing: true,
            });
            if (release)
                lifetime.onRetire(release);
            lifetime.assertCurrent();
            const finalDto = await (0, hooks_1.applySendingGate)(this.hookManager, sessionId, type, input, 'MessageService');
            lifetime.assertCurrent();
            const engine = this.getEngine(sessionId);
            const prepared = prepare?.(finalDto);
            const message = await this.saveOutgoingMessage(sessionId, await buildPending(finalDto, prepared), lifetime);
            lifetime.assertCurrent();
            persisted = true;
            return { finalDto, engine, prepared, message };
        }
        finally {
            release?.(persisted);
            lifetime.close();
        }
    }
    async failSend(sessionId, type, message, input, error) {
        try {
            if ((0, send_pacing_service_1.countsTowardSendBreaker)(error)) {
                this.pacing.recordSendFailure(sessionId);
                this.logger.warn(`Send failed in the engine (${type})`, {
                    sessionId,
                    chatId: message.chatId,
                    messageId: message.id,
                    error: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
                    ...(error instanceof Error && error.cause instanceof Error ? { cause: error.cause.message } : {}),
                });
            }
            await this.saveFailedMessage(message);
            const hookError = error instanceof ssrf_guard_1.SsrfBlockedError
                ? ssrf_guard_1.SSRF_BLOCKED_CLIENT_MESSAGE
                : error instanceof Error
                    ? error.message
                    : String(error);
            await this.hookManager.execute('message:failed', { sessionId, error: hookError, input, type }, { sessionId, source: 'MessageService' });
            throw this.toClientFacingError(error);
        }
        catch (failure) {
            throw (0, engine_send_failure_1.markEngineSendFailure)(failure);
        }
    }
    async sendTemplate(sessionId, dto) {
        const template = await this.templateService.resolve(sessionId, {
            templateId: dto.templateId,
            templateName: dto.templateName,
        });
        const vars = dto.vars ?? {};
        const parts = [template.header, template.body, template.footer].filter((segment) => segment != null && segment.length > 0);
        const separator = '\n\n';
        const maxChars = this.configService?.get('template.renderMaxChars', exports.DEFAULT_TEMPLATE_RENDER_MAX_CHARS) ??
            exports.DEFAULT_TEMPLATE_RENDER_MAX_CHARS;
        let text;
        try {
            const length = parts.reduce((sum, part) => sum + (0, template_render_1.renderedLength)(part, vars), 0) +
                separator.length * Math.max(0, parts.length - 1);
            if (length > maxChars) {
                throw new common_1.BadRequestException(`Rendered template is ${length} characters, over the ${maxChars}-character limit`);
            }
            text = parts.map(part => (0, template_render_1.renderTemplate)(part, vars)).join(separator);
        }
        catch (error) {
            if (error instanceof template_render_1.TemplateRenderError)
                throw new common_1.BadRequestException(error.message);
            throw error;
        }
        return this.sendText(sessionId, {
            chatId: dto.chatId,
            text,
            mentions: dto.mentions,
            linkPreview: dto.linkPreview,
        });
    }
    async sendImage(sessionId, dto) {
        const { message, finalDto, engine, prepared: media, } = await this.applySendingGate(sessionId, 'image', dto, (finalDto, media) => ({
            chatId: finalDto.chatId,
            body: finalDto.caption || '',
            type: 'image',
            quotedMessageId: finalDto.quotedMessageId,
            metadata: {
                media: { mimetype: finalDto.mimetype, filename: finalDto.filename, data: media.data },
            },
        }), (d) => this.buildMediaInput(d));
        let result;
        try {
            result = await engine.sendImageMessage(finalDto.chatId, media);
        }
        catch (error) {
            return this.failSend(sessionId, 'image', message, finalDto, error);
        }
        return this.persistSentState(message, result);
    }
    async sendVideo(sessionId, dto) {
        const { message, finalDto, engine, prepared: media, } = await this.applySendingGate(sessionId, 'video', dto, (finalDto, media) => ({
            chatId: finalDto.chatId,
            body: finalDto.caption || '',
            type: 'video',
            quotedMessageId: finalDto.quotedMessageId,
            metadata: {
                media: { mimetype: finalDto.mimetype, filename: finalDto.filename, data: media.data },
            },
        }), (d) => this.buildMediaInput(d));
        let result;
        try {
            result = await engine.sendVideoMessage(finalDto.chatId, media);
        }
        catch (error) {
            return this.failSend(sessionId, 'video', message, finalDto, error);
        }
        return this.persistSentState(message, result);
    }
    async sendAudio(sessionId, dto) {
        const { message, finalDto, engine, prepared: { media }, } = await this.applySendingGate(sessionId, dto.ptt ? 'voice' : 'audio', dto, (finalDto, { audioDto, media }) => ({
            chatId: finalDto.chatId,
            type: finalDto.ptt ? 'voice' : 'audio',
            metadata: {
                media: { mimetype: audioDto.mimetype, filename: finalDto.filename, data: media.data },
            },
            quotedMessageId: finalDto.quotedMessageId,
        }), (gated) => {
            const audioDto = gated.ptt && !gated.mimetype ? { ...gated, mimetype: 'audio/ogg; codecs=opus' } : gated;
            const media = this.buildMediaInput(audioDto);
            media.ptt = gated.ptt;
            return { audioDto, media };
        });
        let result;
        try {
            result = await engine.sendAudioMessage(finalDto.chatId, media);
        }
        catch (error) {
            return this.failSend(sessionId, finalDto.ptt ? 'voice' : 'audio', message, finalDto, error);
        }
        return this.persistSentState(message, result);
    }
    async sendDocument(sessionId, dto) {
        const { message, finalDto, engine, prepared: media, } = await this.applySendingGate(sessionId, 'document', dto, (finalDto, media) => ({
            chatId: finalDto.chatId,
            body: finalDto.caption || finalDto.filename || '',
            type: 'document',
            quotedMessageId: finalDto.quotedMessageId,
            metadata: {
                media: { mimetype: finalDto.mimetype, filename: finalDto.filename, data: media.data },
            },
        }), (d) => this.buildMediaInput(d));
        let result;
        try {
            result = await engine.sendDocumentMessage(finalDto.chatId, media);
        }
        catch (error) {
            return this.failSend(sessionId, 'document', message, finalDto, error);
        }
        return this.persistSentState(message, result);
    }
    async sendLocation(sessionId, dto) {
        const { message, finalDto, engine } = await this.applySendingGate(sessionId, 'location', dto, finalDto => ({
            chatId: finalDto.chatId,
            body: `📍 ${finalDto.description || 'Location'}`,
            type: 'location',
            quotedMessageId: finalDto.quotedMessageId,
        }));
        let result;
        try {
            result = await engine.sendLocationMessage(finalDto.chatId, {
                latitude: finalDto.latitude,
                longitude: finalDto.longitude,
                description: finalDto.description,
                address: finalDto.address,
                quotedMessageId: finalDto.quotedMessageId,
            });
        }
        catch (error) {
            return this.failSend(sessionId, 'location', message, finalDto, error);
        }
        return this.persistSentState(message, result);
    }
    async sendContact(sessionId, dto) {
        const { message, finalDto, engine } = await this.applySendingGate(sessionId, 'contact', dto, finalDto => ({
            chatId: finalDto.chatId,
            body: `📇 ${finalDto.contactName}`,
            type: 'contact',
            quotedMessageId: finalDto.quotedMessageId,
        }));
        let result;
        try {
            result = await engine.sendContactMessage(finalDto.chatId, {
                name: finalDto.contactName,
                number: finalDto.contactNumber,
                quotedMessageId: finalDto.quotedMessageId,
            });
        }
        catch (error) {
            return this.failSend(sessionId, 'contact', message, finalDto, error);
        }
        return this.persistSentState(message, result);
    }
    async sendPoll(sessionId, dto) {
        const { message, finalDto, engine } = await this.applySendingGate(sessionId, 'poll', dto, finalDto => ({
            chatId: finalDto.chatId,
            body: `📊 ${finalDto.name}`,
            type: 'poll',
            metadata: {
                poll: {
                    name: finalDto.name,
                    options: [...finalDto.options],
                    allowMultipleAnswers: finalDto.allowMultipleAnswers === true,
                },
            },
            quotedMessageId: finalDto.quotedMessageId,
        }));
        let result;
        try {
            result = await engine.sendPollMessage(finalDto.chatId, {
                name: finalDto.name,
                options: finalDto.options,
                allowMultipleAnswers: finalDto.allowMultipleAnswers === true,
                quotedMessageId: finalDto.quotedMessageId,
            });
        }
        catch (error) {
            return this.failSend(sessionId, 'poll', message, finalDto, error);
        }
        return this.persistSentState(message, result);
    }
    async sendSticker(sessionId, dto) {
        const { message, finalDto, engine, prepared: media, } = await this.applySendingGate(sessionId, 'sticker', dto, (finalDto, media) => ({
            chatId: finalDto.chatId,
            type: 'sticker',
            quotedMessageId: finalDto.quotedMessageId,
            metadata: {
                media: { mimetype: finalDto.mimetype, filename: finalDto.filename, data: media.data },
            },
        }), (d) => this.buildMediaInput(d));
        let result;
        try {
            result = await engine.sendStickerMessage(finalDto.chatId, media);
        }
        catch (error) {
            return this.failSend(sessionId, 'sticker', message, finalDto, error);
        }
        return this.persistSentState(message, result);
    }
    async reply(sessionId, dto) {
        const { message, finalDto, engine } = await this.applySendingGate(sessionId, 'reply', dto, async (finalDto) => {
            const quotedBody = await this.resolveQuotedBody(sessionId, finalDto.quotedMessageId, finalDto.chatId);
            return {
                chatId: finalDto.chatId,
                body: finalDto.text,
                type: 'text',
                metadata: {
                    quotedMessage: { id: finalDto.quotedMessageId, body: quotedBody },
                },
            };
        });
        let result;
        try {
            result = finalDto.mentions?.length
                ? await engine.replyToMessage(finalDto.chatId, finalDto.quotedMessageId, finalDto.text, finalDto.mentions)
                : await engine.replyToMessage(finalDto.chatId, finalDto.quotedMessageId, finalDto.text);
        }
        catch (error) {
            return this.failSend(sessionId, 'reply', message, finalDto, error);
        }
        return this.persistSentState(message, result);
    }
    async clickButton(sessionId, dto) {
        const { message, finalDto, engine } = await this.applySendingGate(sessionId, 'click-button', dto, async (finalDto) => {
            const promptBody = await this.resolveQuotedBody(sessionId, finalDto.messageId, finalDto.chatId);
            return {
                chatId: finalDto.chatId,
                body: finalDto.text || finalDto.buttonId,
                type: 'text',
                metadata: {
                    quotedMessage: { id: finalDto.messageId, body: promptBody },
                    button: { id: finalDto.buttonId, text: finalDto.text },
                },
            };
        });
        let result;
        try {
            result = await engine.clickButton(finalDto.chatId, finalDto.messageId, finalDto.buttonId, finalDto.text);
        }
        catch (error) {
            return this.failSend(sessionId, 'click-button', message, finalDto, error);
        }
        if (result.body) {
            message.body = result.body;
            message.metadata = {
                ...(message.metadata ?? {}),
                button: { id: finalDto.buttonId, text: result.body },
            };
        }
        return this.persistSentState(message, result, result.body
            ? { body: result.body, metadata: message.metadata }
            : undefined);
    }
    async forward(sessionId, dto) {
        const { message, finalDto, engine } = await this.applySendingGate(sessionId, 'forward', dto, finalDto => ({
            chatId: finalDto.toChatId,
            body: '[Forwarded]',
            type: 'forward',
        }));
        let result;
        try {
            result = await engine.forwardMessage(finalDto.fromChatId, finalDto.toChatId, finalDto.messageId);
        }
        catch (error) {
            return this.failSend(sessionId, 'forward', message, finalDto, error);
        }
        return this.persistSentState(message, result);
    }
    async resolveQuotedBody(sessionId, quotedMessageId, chatId) {
        try {
            const store = this.lidMappingStore;
            const expanded = chatId
                ? await (0, jid_candidates_1.resolveJidCandidates)(chatId, store && {
                    resolveLid: lid => store.findPhoneForLid(lid),
                    lidsForPhone: phone => store.findLidsForPhone(phone),
                })
                : [];
            const inFlight = this.messageProjector?.inFlightInbound(sessionId, quotedMessageId);
            if (inFlight && (!chatId || inFlight.chatId === chatId || expanded.includes(inFlight.chatId))) {
                return typeof inFlight.body === 'string' ? inFlight.body : '';
            }
            const quoted = await this.messageRepository.findOne({
                where: chatId
                    ? { sessionId, chatId: (0, typeorm_2.In)([...new Set([chatId, ...expanded])]), waMessageId: quotedMessageId }
                    : { sessionId, waMessageId: quotedMessageId },
            });
            return quoted?.body || '';
        }
        catch (err) {
            this.logger.warn(`Failed to resolve quoted message ${quotedMessageId}`, { error: String(err) });
            return '';
        }
    }
    async saveOutgoingMessage(sessionId, data, lifetime) {
        const scope = lifetime ?? (0, session_write_scope_1.captureSessionWrites)(this.messageRepository.manager?.connection ?? this.messageRepository, sessionId);
        try {
            const session = await this.sessionService.findOne(sessionId);
            const quotedMessage = data.quotedMessageId
                ? { id: data.quotedMessageId, body: await this.resolveQuotedBody(sessionId, data.quotedMessageId) }
                : undefined;
            const message = this.messageRepository.create({
                sessionId,
                waMessageId: data.waMessageId || undefined,
                chatId: data.chatId,
                from: session?.phone ? `${session.phone}@c.us` : 'me',
                to: data.chatId,
                body: data.body,
                type: data.type,
                direction: message_entity_1.MessageDirection.OUTGOING,
                timestamp: data.timestamp,
                status: data.status ?? message_entity_1.MessageStatus.PENDING,
                metadata: quotedMessage ? { ...data.metadata, quotedMessage } : data.metadata,
            });
            const saved = await scope
                .write(() => this.messageRepository.save(message, { transaction: false }))
                .catch(async (err) => {
                const waMessageId = message.waMessageId;
                if (!waMessageId || !(0, db_errors_1.isUniqueViolation)(err))
                    throw err;
                const patch = {
                    timestamp: message.timestamp,
                };
                const metadata = message.metadata;
                if (metadata && !isUrlPointerMetadata(metadata)) {
                    try {
                        await (0, message_metadata_1.updateMessageMetadata)(this.messageRepository, { sessionId, waMessageId }, current => (0, message_metadata_1.mergeSentMetadata)(current, metadata));
                    }
                    catch (error) {
                        if (message.status !== message_entity_1.MessageStatus.SENT)
                            throw error;
                        this.logger.warn(`Merging sent metadata onto the echo row failed (id=${waMessageId})`, {
                            error: error instanceof Error ? error.message : String(error),
                        });
                        return scope.write(() => this.messageRepository.save(this.messageRepository.create({ ...message, waMessageId: undefined })));
                    }
                }
                if (message.timestamp !== undefined)
                    await this.messageRepository.update({ sessionId, waMessageId }, patch);
                const surviving = await this.messageRepository.findOne({ where: { sessionId, waMessageId } });
                if (!surviving)
                    throw err;
                return surviving;
            });
            this.emitPersisted(sessionId, saved);
            return saved;
        }
        finally {
            if (!lifetime)
                scope.close();
        }
    }
    emitPersisted(sessionId, message) {
        void this.hookManager
            .execute('message:persisted', { sessionId, message: { ...message } }, { sessionId, source: 'MessageService' })
            .catch(() => undefined);
        if (message.status === message_entity_1.MessageStatus.SENT && this.archiveOutboundEnabled) {
            void this.chatMediaArchive?.archive(message).catch(() => undefined);
        }
    }
    get archiveOutboundEnabled() {
        return this.configService?.get('chatMedia.archiveOutbound', false) === true;
    }
    async saveFailedMessage(message) {
        const media = message.metadata?.media;
        if (media) {
            delete media.data;
        }
        message.status = message_entity_1.MessageStatus.FAILED;
        const result = await this.messageRepository.update({ id: message.id, sessionId: message.sessionId }, {
            status: message_entity_1.MessageStatus.FAILED,
            metadata: message.metadata,
        });
        if (!result.affected)
            return;
        this.emitPersisted(message.sessionId, message);
    }
    async persistSentState(message, result, changed = {}) {
        this.pacing.recordSendSuccess(message.sessionId);
        if (result.id)
            message.waMessageId = result.id;
        message.status = message_entity_1.MessageStatus.SENT;
        message.timestamp = result.timestamp;
        try {
            const sent = {
                ...changed,
                waMessageId: message.waMessageId,
                status: message.status,
                timestamp: message.timestamp,
            };
            let updated = await this.messageRepository.update({ id: message.id, sessionId: message.sessionId, status: message_entity_1.MessageStatus.PENDING }, sent);
            if (!updated.affected) {
                updated = await this.messageRepository.update({ id: message.id, sessionId: message.sessionId }, { ...sent, metadata: message.metadata });
            }
            if (!updated.affected)
                return { messageId: result.id, timestamp: result.timestamp };
            this.emitPersisted(message.sessionId, message);
        }
        catch (persistError) {
            if (result.id && (0, db_errors_1.isUniqueViolation)(persistError)) {
                this.logger.debug(`Send echo already persisted ${result.id}; merging state and dropping the redundant pending row`, {
                    messageId: message.id,
                });
                const patch = { timestamp: result.timestamp };
                const metadata = message.metadata;
                let metadataMerged = true;
                if (metadata && !isUrlPointerMetadata(metadata)) {
                    await (0, message_metadata_1.updateMessageMetadata)(this.messageRepository, { sessionId: message.sessionId, waMessageId: result.id }, current => (0, message_metadata_1.mergeSentMetadata)(current, metadata)).catch(err => {
                        metadataMerged = false;
                        this.logger.warn(`Merging media onto the echo-persisted row failed (id=${result.id})`, {
                            error: err instanceof Error ? err.message : String(err),
                        });
                    });
                }
                if (!metadataMerged) {
                    await this.messageRepository
                        .update({ id: message.id, status: message_entity_1.MessageStatus.PENDING }, { status: message_entity_1.MessageStatus.SENT, timestamp: result.timestamp, ...changed })
                        .catch(err => this.logger.warn(`Preserving the sent media row failed (id=${message.id})`, {
                        error: err instanceof Error ? err.message : String(err),
                    }));
                    const retained = await this.messageRepository.findOne({ where: { id: message.id } }).catch(() => null);
                    if (retained)
                        this.emitPersisted(message.sessionId, retained);
                    return { messageId: result.id, timestamp: result.timestamp };
                }
                await this.messageRepository
                    .update({ sessionId: message.sessionId, waMessageId: result.id }, patch)
                    .catch(err => this.logger.warn(`Merging SENT state onto the echo-persisted row failed (id=${result.id})`, {
                    error: err instanceof Error ? err.message : String(err),
                }));
                await this.messageRepository.delete({ id: message.id }).catch(() => undefined);
                const surviving = await this.messageRepository
                    .findOne({ where: { sessionId: message.sessionId, waMessageId: result.id } })
                    .catch(() => null);
                if (surviving)
                    this.emitPersisted(message.sessionId, surviving);
                void this.hookManager
                    .execute('message:deleted', { sessionId: message.sessionId, message: { ...message } }, { sessionId: message.sessionId, source: 'MessageService' })
                    .catch(() => undefined);
            }
            else {
                this.logger.warn(`Persisting SENT state failed after a successful send (id=${result.id})`, {
                    error: persistError instanceof Error ? persistError.message : String(persistError),
                });
            }
        }
        return { messageId: result.id, timestamp: result.timestamp };
    }
    getEngine(sessionId) {
        return this.engines.require(sessionId, () => new common_1.BadRequestException(`Session '${sessionId}' is not active. Start the session first.`));
    }
    async simulateTypingIfEnabled(engine, chatId, text) {
        const { simulateTyping, simulateTypingMaxMs } = (0, feature_flags_1.resolveFeatureFlags)(this.configService);
        if (!simulateTyping)
            return;
        try {
            await engine.sendChatState(chatId, 'typing');
            const maxMs = simulateTypingMaxMs;
            const planned = Math.min(maxMs, 500 + text.length * 45);
            const jittered = Math.round(planned * (0.85 + Math.random() * 0.3));
            await new Promise(resolve => setTimeout(resolve, Math.min(maxMs, jittered)));
        }
        catch (error) {
            this.logger.warn(`simulateTyping skipped: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    toClientFacingError(error) {
        if (error instanceof ssrf_guard_1.SsrfBlockedError) {
            this.logger.warn(`Outbound media fetch blocked by SSRF guard: ${error.message}`);
            return (0, engine_not_sent_error_1.markNothingSent)(new common_1.BadRequestException(ssrf_guard_1.SSRF_BLOCKED_CLIENT_MESSAGE));
        }
        return error;
    }
    buildMediaInput(dto) {
        const { mimetype, data } = (0, media_cap_util_1.resolveMediaBody)(dto, {
            fallbackMimetype: 'application/octet-stream',
            requireMimetypeForBase64: true,
            checkUrl: true,
        });
        return {
            mimetype,
            data,
            filename: dto.filename,
            caption: dto.caption,
            mentions: dto.mentions,
            quotedMessageId: dto.quotedMessageId,
        };
    }
    buildCustomPreview(preview) {
        if (!preview)
            return undefined;
        const { thumbnailUrl, thumbnailBase64, ...metadata } = preview;
        const base64 = (0, media_cap_util_1.stripBase64DataUri)(thumbnailBase64);
        if (base64) {
            (0, media_cap_util_1.assertBase64WithinMediaCap)(base64, load_remote_media_1.LINK_PREVIEW_THUMBNAIL_MAX_BYTES);
            return { ...metadata, thumbnailBase64: base64 };
        }
        if (thumbnailUrl != null) {
            if (!(0, media_url_1.isMediaUrl)(thumbnailUrl)) {
                throw new common_1.BadRequestException(`customLinkPreview.thumbnailUrl: ${media_url_1.MEDIA_URL_MESSAGE}`);
            }
            return { ...metadata, thumbnailUrl };
        }
        return metadata;
    }
};
exports.MessageSendService = MessageSendService;
exports.MessageSendService = MessageSendService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(message_entity_1.Message, 'data')),
    __param(6, (0, common_1.Optional)()),
    __param(7, (0, common_1.Optional)()),
    __param(8, (0, common_1.Optional)()),
    __param(9, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        session_service_1.SessionService,
        engine_registry_service_1.EngineRegistry,
        hooks_1.HookManager,
        template_service_1.TemplateService,
        send_pacing_service_1.SendPacingService,
        config_1.ConfigService,
        chat_media_archive_service_1.ChatMediaArchiveService,
        lid_mapping_store_service_1.LidMappingStoreService,
        message_projector_service_1.MessageProjector])
], MessageSendService);
//# sourceMappingURL=message-send.service.js.map