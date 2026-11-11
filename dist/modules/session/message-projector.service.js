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
exports.MessageProjector = exports.PERSIST_RETRY_DELAY_MS = exports.ACK_RECONCILE_DELAY_MS = void 0;
const lid_mapping_store_service_1 = require("../../engine/identity/lid-mapping-store.service");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const session_entity_1 = require("./entities/session.entity");
const message_entity_1 = require("../message/entities/message.entity");
const engine_registry_service_1 = require("../../engine/engine-registry.service");
const keyed_mutation_queue_1 = require("../../common/utils/keyed-mutation-queue");
const shared_connection_1 = require("../../common/utils/shared-connection");
const session_write_scope_1 = require("../../common/utils/session-write-scope");
const session_lid_resolver_service_1 = require("./session-lid-resolver.service");
const message_row_mapper_1 = require("./message-row.mapper");
const message_mutation_projector_1 = require("./message-mutation-projector");
const message_mutation_guard_1 = require("./message-mutation-guard");
const message_metadata_1 = require("../message/message-metadata");
const message_history_projector_1 = require("./message-history-projector");
const db_errors_1 = require("../../common/utils/db-errors");
const feature_flags_1 = require("../../config/feature-flags");
const status_store_service_1 = require("../status-store/status-store.service");
const chat_media_archive_service_1 = require("../chat-media/chat-media-archive.service");
const automation_rules_service_1 = require("../automation/automation-rules.service");
const incoming_status_1 = require("../status-store/incoming-status");
const inbound_room_1 = require("./inbound-room");
const logger_service_1 = require("../../common/services/logger.service");
const events_gateway_1 = require("../events/events.gateway");
const webhook_service_1 = require("../webhook/webhook.service");
const hooks_1 = require("../../core/hooks");
const message_status_util_1 = require("../message/message-status.util");
const hook_results_1 = require("../../core/hooks/hook-results");
exports.ACK_RECONCILE_DELAY_MS = 750;
exports.PERSIST_RETRY_DELAY_MS = 300;
const EDITED_MARKS_KEPT_PER_SESSION = 500;
const quoteOf = (m) => ({ chatId: m.chatId, body: m.body });
const deletedPlaceholder = (message) => {
    const { media, quotedMessage, call, buttons, button, location, order, product, poll, mentionedIds, ...kept } = message;
    return { ...kept, body: '', type: 'revoked' };
};
const refOf = (m) => ({
    chatId: m.chatId,
    direction: m.fromMe ? message_entity_1.MessageDirection.OUTGOING : message_entity_1.MessageDirection.INCOMING,
    author: m.author,
});
const claimOf = (m) => ({
    kind: 'edit',
    chatId: m.chatId,
    fromMe: m.fromMe,
    author: m.author,
});
class InboundTurn {
    engine;
    entry;
    room;
    s;
    state = 'pending';
    outcome = (0, inbound_room_1.deferred)();
    emitted = (0, inbound_room_1.deferred)();
    hookGate = (0, inbound_room_1.deferred)();
    preparing;
    constructor(engine, entry, room, s) {
        this.engine = engine;
        this.entry = entry;
        this.room = room;
        this.s = s;
    }
    get revoked() {
        return this.entry.revoked === true;
    }
    prepareIdentity(pending) {
        this.preparing = Promise.race([pending, this.outcome.promise.then(() => undefined)]);
    }
    reserve() {
        if (!this.s || !this.room || this.state === 'dropped')
            return false;
        if (this.preparing) {
            const preparing = this.preparing;
            return preparing.then(() => {
                if (this.preparing === preparing)
                    this.preparing = undefined;
                return this.reserve();
            });
        }
        if (this.entry.revoked)
            return this.giveUp();
        return this.s.granted || this.room.wait(this.s).then(granted => granted && !this.entry.revoked);
    }
    giveUp() {
        if (this.s && !this.s.granted) {
            this.s.abandoned = true;
            this.s.grant.resolve(false);
        }
        return false;
    }
    holdUntil(p) {
        this.s?.holds.push(p.catch(() => undefined));
    }
    emit(job) {
        if (this.state !== 'pending')
            return;
        this.state = 'emitted';
        this.emitted.resolve();
        this.outcome.resolve(job);
    }
    drop() {
        if (this.state !== 'pending')
            return;
        this.state = 'dropped';
        this.outcome.resolve(null);
        this.emitted.resolve();
        this.giveUp();
    }
}
let MessageProjector = class MessageProjector {
    messageRepository;
    sessionRepository;
    engines;
    eventsGateway;
    webhookService;
    hookManager;
    statusStore;
    lidResolver;
    configService;
    chatMediaArchive;
    automationRules;
    lidMappingStore;
    logger = (0, logger_service_1.createLogger)('MessageProjector');
    messageMutations = new keyed_mutation_queue_1.KeyedMutationQueue((key, err) => {
        this.logger.error(`Unexpected failure applying message mutation: ${key}`, String(err));
    });
    chatCommits = new keyed_mutation_queue_1.KeyedMutationQueue((key, err) => {
        this.logger.error(`Unexpected failure committing a message: ${key}`, String(err));
    });
    chatEmits = new keyed_mutation_queue_1.KeyedMutationQueue((key, err) => {
        this.logger.error(`Unexpected failure ordering a message: ${key}`, String(err));
    });
    rooms = new Map();
    tickets = new Map();
    inboundInFlight = new Map();
    markedEdited = new Map();
    mutationProjector;
    constructor(messageRepository, sessionRepository, engines, eventsGateway, webhookService, hookManager, statusStore, lidResolver, configService, chatMediaArchive, automationRules, lidMappingStore) {
        this.messageRepository = messageRepository;
        this.sessionRepository = sessionRepository;
        this.engines = engines;
        this.eventsGateway = eventsGateway;
        this.webhookService = webhookService;
        this.hookManager = hookManager;
        this.statusStore = statusStore;
        this.lidResolver = lidResolver;
        this.configService = configService;
        this.chatMediaArchive = chatMediaArchive;
        this.automationRules = automationRules;
        this.lidMappingStore = lidMappingStore;
        this.mutationProjector = new message_mutation_projector_1.MessageMutationProjector(this.messageRepository, this.eventsGateway, this.webhookService, this.messageMutations, this.logger, (sessionId, waMessageId) => this.noteMarkedEdited(sessionId, waMessageId), this.lidMappingStore ? jid => this.lidMappingStore.findPhoneForLid(jid) : undefined, (sessionId, waMessageId) => this.announceChangedRow(sessionId, waMessageId));
        this.engines.onRetire((id, engine) => {
            for (const t of this.tickets.get(id) ?? [])
                if (t.engine === engine)
                    t.drop();
            this.deleteRoomIfIdle(id);
            if (!this.engines.has(id))
                this.markedEdited.delete(id);
        });
    }
    noteMarkedEdited(sessionId, waMessageId) {
        let marks = this.markedEdited.get(sessionId);
        if (!marks)
            this.markedEdited.set(sessionId, (marks = new Set()));
        marks.add(waMessageId);
        if (marks.size > EDITED_MARKS_KEPT_PER_SESSION)
            marks.delete(marks.values().next().value);
    }
    get holdsInbound() {
        return this.messageRepository.manager?.connection?.options?.type === 'postgres';
    }
    admitInbound(id, engine, a) {
        if (!this.engines.isLive(id, engine))
            return undefined;
        const key = a.status || !a.id ? null : `${id}:${a.id}`;
        let entry = {};
        if (key) {
            entry = this.inboundInFlight.get(key) ?? entry;
            this.inboundInFlight.set(key, entry);
            if (a.fromMe !== undefined)
                entry.ref ??= refOf({ chatId: a.chatId, fromMe: a.fromMe, author: a.author });
        }
        entry.holders = (entry.holders ?? 0) + 1;
        const room = a.needsRoom ? this.room(id) : undefined;
        const source = { kind: 'edit', chatId: a.chatId, fromMe: a.fromMe, author: a.author };
        const separate = entry.ref && (0, message_mutation_guard_1.mutationTargetsForeignRow)(entry.ref, source) !== null;
        const scoped = separate
            ? { ref: a.fromMe === undefined ? undefined : refOf({ chatId: a.chatId, fromMe: a.fromMe, author: a.author }) }
            : entry;
        const t = new InboundTurn(engine, scoped, room, room && (0, inbound_room_1.roomState)());
        let set = this.tickets.get(id);
        if (!set)
            this.tickets.set(id, (set = new Set()));
        set.add(t);
        const finish = () => {
            if (entry.holders)
                entry.holders--;
            if (key && !entry.holders && this.inboundInFlight.get(key) === entry)
                this.inboundInFlight.delete(key);
            set.delete(t);
            if (!set.size && this.tickets.get(id) === set)
                this.tickets.delete(id);
            t.s?.done.resolve();
        };
        if (a.status) {
            void t.outcome.promise.then(finish);
        }
        else {
            const chatKey = `${id}:${a.chatId}`;
            this.chatEmits.enqueue(chatKey, () => {
                t.hookGate.resolve();
                return t.emitted.promise;
            });
            this.chatCommits.enqueue(chatKey, async () => {
                try {
                    const job = await t.outcome.promise;
                    if (job)
                        await job();
                }
                finally {
                    finish();
                }
            });
        }
        if (room && t.s) {
            void room.request(t.s).then(() => {
                if (!this.engines.has(id))
                    this.deleteRoomIfIdle(id);
            });
        }
        if (key && separate && this.lidMappingStore) {
            const pending = this.changeInFlight(id, a.id, source, (needsRow, shared) => {
                if (!this.engines.isLive(id, engine) || t.state === 'dropped')
                    return;
                if (shared && !needsRow) {
                    t.entry = shared;
                    if (shared.revoked)
                        t.giveUp();
                }
            });
            if (pending)
                t.prepareIdentity(pending.then(() => this.waitForInFlightChanges(id, a.id)));
        }
        return t;
    }
    room(id) {
        let room = this.rooms.get(id);
        if (!room)
            this.rooms.set(id, (room = new inbound_room_1.InboundRoom()));
        return room;
    }
    deleteRoomIfIdle(id) {
        if (this.rooms.get(id)?.idle)
            this.rooms.delete(id);
    }
    handleInboundMessage(id, engine, message, ticket) {
        const turn = ticket instanceof InboundTurn ? ticket : undefined;
        try {
            return this.receiveInbound(id, engine, message, turn);
        }
        finally {
            turn?.drop();
        }
    }
    receiveInbound(id, engine, message, turn) {
        if (!this.engines.isLive(id, engine))
            return;
        if (message.isStatusBroadcast) {
            const ingest = this.ingestInboundStatus(id, engine, message);
            turn?.holdUntil(ingest);
            let judged;
            const judge = () => ingest.then(() => this.judgeRepeat(id, message));
            return {
                get settled() {
                    return (judged ??= judge());
                },
            };
        }
        if (this.shouldSkipEphemeralMessage(id, message))
            return;
        this.logger.debug(`Message received from ${message.from}`, {
            sessionId: id,
            messageId: message.id,
            from: message.from,
            action: 'message_received',
        });
        void this.sessionRepository.update(id, { lastActiveAt: new Date() }).catch(() => undefined);
        const messageData = message.type === 'revoked' ? deletedPlaceholder(message) : { ...message };
        delete messageData.originalBody;
        const inFlightKey = `${id}:${message.id}`;
        const inFlight = turn
            ? Object.assign(turn.entry, { ref: turn.entry.ref ?? refOf(messageData) })
            : this.trackInFlight(inFlightKey, messageData);
        const delivery = {
            entry: inFlight,
            body: message.originalBody ?? message.body,
            edited: message.originalBody !== undefined,
        };
        const quoteOwner = {};
        const onFailure = (err) => {
            this.logger.error(`onMessage handler failed for ${id}`, String(err));
            return null;
        };
        const prepared = this.startHookChain(id, engine, turn, messageData, delivery, quoteOwner, messageData => this.hookManager
            .execute('message:received', messageData, {
            sessionId: id,
            source: 'Engine',
            accept: data => {
                if (!(0, hook_results_1.isMessagePayload)(data))
                    return false;
                if (delivery.entry.quoteOwner === quoteOwner)
                    delivery.entry.quote = quoteOf(data);
                return true;
            },
        })
            .then(({ data }) => this.prepareInboundMessage(id, this.messageOrEngineCopy(id, 'message:received', data, messageData)))).catch(onFailure);
        const outcome = (0, inbound_room_1.deferred)();
        this.commitInTurn(id, message, turn, async () => {
            try {
                const finalMessage = await prepared;
                if (finalMessage)
                    outcome.resolve(await this.commitInboundMessage(id, engine, finalMessage, delivery.entry));
            }
            catch (err) {
                onFailure(err);
            }
            finally {
                outcome.resolve(undefined);
                this.clearQuote(delivery.entry, quoteOwner);
                if (!turn)
                    this.untrackInFlight(inFlightKey, inFlight);
            }
        });
        return { settled: outcome.promise };
    }
    startHookChain(id, engine, turn, messageData, delivery, quoteOwner, run) {
        const checked = async () => {
            let data = messageData;
            if (data.id && data.type !== 'revoked') {
                try {
                    const connection = this.messageRepository.manager?.connection;
                    if (connection && !(await (0, shared_connection_1.awaitNoOpenTransaction)(connection))) {
                        throw new Error('Timed out waiting for the message database transaction');
                    }
                    const row = await this.messageRepository.findOne({
                        where: { sessionId: id, waMessageId: data.id, type: 'revoked' },
                        select: { type: true, chatId: true, direction: true, author: true },
                    });
                    if (row?.type === 'revoked' &&
                        !(await (0, message_mutation_guard_1.mutationTargetsForeignRowPersisted)(row, claimOf(data), this.lidMappingStore ? jid => this.lidMappingStore.findPhoneForLid(jid) : undefined))) {
                        data = deletedPlaceholder(data);
                    }
                }
                catch (error) {
                    this.logger.warn('Failed to read the stored message before its hooks; keeping the delivery', {
                        sessionId: id,
                        messageId: data.id,
                        error: String(error),
                    });
                }
            }
            if (!this.engines.isLive(id, engine))
                return null;
            let result = null;
            const preparing = this.changeInFlight(id, data.id, claimOf(data), (needsRow, pending) => {
                if (!this.engines.isLive(id, engine))
                    return;
                delivery.entry = pending && !needsRow ? pending : { ref: refOf(data) };
                this.arrive(delivery.entry, delivery);
                const skipHooks = turn && delivery.entry.revoked && messageData.type !== 'revoked';
                if (data.type === 'revoked')
                    this.holdRevoked(id, delivery.entry);
                if (pending && !needsRow) {
                    if (pending.revoked)
                        data = deletedPlaceholder(data);
                    else if (pending.editedBody !== undefined)
                        data.body = pending.editedBody;
                    if (skipHooks) {
                        result = Promise.resolve(data);
                        return;
                    }
                    pending.quote = quoteOf(data);
                    pending.quoteOwner = quoteOwner;
                }
                result = run(data);
            });
            if (preparing)
                await preparing;
            return result;
        };
        if (!turn)
            return checked();
        return turn.hookGate.promise.then(async () => {
            await this.waitForInFlightChanges(id, messageData.id);
            if (!this.engines.isLive(id, engine))
                return null;
            return checked();
        });
    }
    commitInTurn(id, message, turn, job) {
        if (turn)
            turn.emit(job);
        else
            this.chatCommits.enqueue(this.chatCommitKey(id, message), job);
    }
    trackInFlight(key, message) {
        if (!message.id)
            return { ref: refOf(message) };
        const inFlight = this.inboundInFlight.get(key) ?? {
            ref: refOf(message),
        };
        inFlight.holders = (inFlight.holders ?? 0) + 1;
        this.inboundInFlight.set(key, inFlight);
        return inFlight;
    }
    arrive(entry, arrival) {
        entry.body = arrival.body;
        if (arrival.edited || (entry.editedBody !== undefined && entry.editedBody !== entry.body)) {
            entry.edited = true;
        }
    }
    holdEdit(entry, body) {
        const soFar = entry.editedBody ?? entry.body;
        if (soFar !== undefined && body !== soFar)
            entry.edited = true;
        entry.editedBody = body;
    }
    untrackInFlight(key, inFlight) {
        if (inFlight.holders)
            inFlight.holders--;
        if (!inFlight.holders && this.inboundInFlight.get(key) === inFlight)
            this.inboundInFlight.delete(key);
    }
    clearQuote(entry, owner) {
        if (entry.quoteOwner !== owner)
            return;
        delete entry.quote;
        delete entry.quoteOwner;
    }
    chatCommitKey(id, message) {
        return `${id}:${message.chatId}`;
    }
    inFlightInbound(sessionId, waMessageId) {
        const entry = waMessageId ? this.inboundInFlight.get(`${sessionId}:${waMessageId}`) : undefined;
        if (!entry?.quote)
            return undefined;
        return entry.revoked ? { chatId: entry.quote.chatId, body: '' } : entry.quote;
    }
    messageOrEngineCopy(id, event, data, message) {
        const candidate = data;
        if ((0, hook_results_1.isMessagePayload)(candidate)) {
            return candidate;
        }
        this.logger.warn(`A ${event} hook returned a payload that is not a message; using the engine's copy`, {
            sessionId: id,
            messageId: message.id,
            received: candidate === null ? 'null' : typeof candidate,
            action: 'hook_message_discarded',
        });
        const copy = { ...message };
        delete copy.originalBody;
        return copy;
    }
    ingestInboundStatus(id, engine, message) {
        if (message.fromMe)
            return Promise.resolve();
        const status = (0, incoming_status_1.buildIncomingStatus)(message);
        if (!status)
            return Promise.resolve();
        return (this.statusStore
            .ingest(id, status)
            .then(({ row, created }) => {
            if (!this.engines.isLive(id, engine))
                return;
            if (created && row.expiresAt > Date.now())
                this.dispatchStatusReceived(id, row);
        })
            .catch(err => this.logger.warn('Status ingest failed', {
            sessionId: id,
            error: err instanceof Error ? err.message : String(err),
        })));
    }
    shouldSkipEphemeralMessage(id, message) {
        if (!(0, feature_flags_1.resolveFeatureFlags)(this.configService).storeEphemeralMessages &&
            message.ephemeralDuration &&
            message.ephemeralDuration > 0) {
            this.logger.debug('Skipping ephemeral message', {
                sessionId: id,
                messageId: message.id,
                chatId: message.chatId,
                ephemeralDuration: message.ephemeralDuration,
            });
            return true;
        }
        return false;
    }
    async prepareInboundMessage(id, finalMessage) {
        const incoming = finalMessage;
        if ((0, feature_flags_1.resolveFeatureFlags)(this.configService).resolveLidToPhone && incoming.isLidSender && !incoming.fromMe) {
            incoming.senderPhone = await this.lidResolver.resolveSenderPhone(id, incoming.author ?? incoming.from);
        }
        return finalMessage;
    }
    async commitInboundMessage(id, engine, finalMessage, entry) {
        const outcome = await this.persistInboundMessage(id, engine, finalMessage, entry);
        if (outcome === 'repeat')
            return this.judgeRepeat(id, finalMessage);
        if (outcome)
            this.dispatchInboundMessage(id, finalMessage, outcome, entry);
        return undefined;
    }
    async judgeRepeat(id, message) {
        const reason = await this.mutationProjector.foreignRowReason(id, (0, message_row_mapper_1.storableWaMessageId)(message.id) ?? '', claimOf(message));
        if (!reason)
            return undefined;
        this.logger.warn('Dropping a message that reuses the id of a different stored message', {
            sessionId: id,
            messageId: message.id,
            reason,
            action: 'message_id_reused',
        });
        return { conflict: true };
    }
    async persistInboundMessage(id, engine, incoming, entry) {
        const metadata = (0, message_row_mapper_1.buildMessageMetadata)(incoming);
        const chatName = incoming.contact?.pushName ?? incoming.contact?.name ?? undefined;
        const dbMessage = this.messageRepository.create({
            sessionId: id,
            waMessageId: (0, message_row_mapper_1.storableWaMessageId)(incoming.id),
            chatId: incoming.chatId,
            chatName,
            author: incoming.author,
            from: incoming.from,
            to: incoming.to,
            body: incoming.body,
            type: incoming.type,
            direction: incoming.fromMe ? message_entity_1.MessageDirection.OUTGOING : message_entity_1.MessageDirection.INCOMING,
            timestamp: incoming.timestamp,
            status: message_entity_1.MessageStatus.SENT,
            metadata,
        });
        await this.waitForInFlightChanges(id, incoming.id);
        if (!this.engines.isLive(id, engine))
            return null;
        const insertedCleared = this.applyHeldChanges(dbMessage, entry);
        const outcome = await this.insertWithRetry(id, engine, dbMessage, 'incoming');
        await this.waitForInFlightChanges(id, incoming.id);
        if (!this.engines.isLive(id, engine))
            return null;
        if (outcome.landed === 'yes') {
            this.applyChangesMadeInFlight(id, incoming.id, entry, insertedCleared);
            return { dbMessage, persisted: true };
        }
        if (outcome.landed === 'stale')
            return null;
        if (outcome.landed === 'dup' && outcome.retried) {
            this.applyChangesMadeInFlight(id, incoming.id, entry, false, claimOf(incoming));
        }
        if (outcome.landed === 'dup' && incoming.type === 'revoked') {
            void this.recordRevoke(id, incoming.id, claimOf(incoming));
        }
        if (outcome.landed === 'dup' && !outcome.retried)
            return 'repeat';
        return { dbMessage, persisted: false };
    }
    applyHeldChanges(dbMessage, entry) {
        if (dbMessage.type === 'revoked') {
            Object.assign(dbMessage, message_row_mapper_1.REVOKED_ROW_PATCH);
            return true;
        }
        if (entry?.revoked)
            Object.assign(dbMessage, message_row_mapper_1.REVOKED_ROW_PATCH);
        else {
            if (entry?.editedBody !== undefined)
                dbMessage.body = entry.editedBody;
            if (entry?.edited)
                dbMessage.metadata = { ...dbMessage.metadata, edited: true };
        }
        return entry?.revoked === true;
    }
    async insertWithRetry(id, engine, dbMessage, direction) {
        const label = `Failed to save ${direction} message ${dbMessage.waMessageId} to database`;
        const insert = async () => {
            const writes = (0, session_write_scope_1.captureSessionWrites)(this.messageRepository.manager?.connection ?? this.messageRepository, id);
            const result = await writes
                .write(() => this.messageRepository.insert(dbMessage))
                .finally(() => writes.close());
            Object.assign(dbMessage, result.identifiers[0] ?? {}, result.generatedMaps?.[0] ?? {});
            return { landed: 'yes' };
        };
        try {
            return await insert();
        }
        catch (err) {
            if ((0, db_errors_1.isUniqueViolation)(err))
                return { landed: 'dup', retried: false };
            if (!(0, db_errors_1.isTransientDbError)(err)) {
                this.logger.error(label, String(err));
                return { landed: 'failed' };
            }
            this.logger.warn(`${label}, retrying once`, { sessionId: id, error: String(err) });
        }
        await new Promise(resolve => setTimeout(resolve, exports.PERSIST_RETRY_DELAY_MS));
        if (!this.engines.isLive(id, engine))
            return { landed: 'stale' };
        try {
            return await insert();
        }
        catch (err) {
            if ((0, db_errors_1.isUniqueViolation)(err))
                return { landed: 'dup', retried: true };
            this.logger.error(label, String(err));
            return { landed: 'failed' };
        }
    }
    applyChangesMadeInFlight(id, waMessageId, pending, insertedCleared = false, lostInsert) {
        const { ackStatus } = pending;
        const rowChanges = Boolean(pending.revoked || pending.editedBody !== undefined || pending.edited || pending.reactions);
        if (!ackStatus && !rowChanges)
            return;
        const advance = () => {
            if (!ackStatus)
                return;
            void this.advanceAck(id, waMessageId, ackStatus).catch(err => this.logger.error(`Failed to advance ack for ${waMessageId}`, String(err)));
        };
        if (!lostInsert) {
            advance();
            if (rowChanges) {
                this.enqueueMessageMutation(id, waMessageId, () => this.writeChangesMadeInFlight(id, waMessageId, pending, insertedCleared));
            }
            return;
        }
        this.enqueueMessageMutation(id, waMessageId, async () => {
            const reason = await this.mutationProjector.foreignRowReason(id, waMessageId, lostInsert);
            if (reason) {
                this.logger.warn('Not applying the changes of a message to the stored message that holds its id', {
                    sessionId: id,
                    messageId: waMessageId,
                    reason,
                });
                return;
            }
            advance();
            await this.writeChangesMadeInFlight(id, waMessageId, pending, insertedCleared);
        });
    }
    async writeChangesMadeInFlight(id, waMessageId, pending, insertedCleared) {
        if (pending.revoked)
            return this.revokeRow(id, waMessageId, !insertedCleared);
        try {
            let textChanged = false;
            if (pending.editedBody !== undefined) {
                const result = await this.messageRepository.update({ sessionId: id, waMessageId, type: (0, typeorm_2.Not)('revoked'), body: (0, typeorm_2.Or)((0, typeorm_2.Not)(pending.editedBody), (0, typeorm_2.IsNull)()) }, { body: pending.editedBody });
                textChanged = Boolean(result?.affected);
            }
            if (pending.reactions)
                await this.storeReactions(id, waMessageId, pending.reactions);
            if (pending.edited)
                await this.mutationProjector.markMessageEdited(id, waMessageId);
            if (textChanged)
                await this.announceChangedRow(id, waMessageId);
        }
        catch (err) {
            this.logger.error(`Failed to apply changes to message ${waMessageId}`, String(err));
        }
    }
    async announceChangedRow(sessionId, waMessageId) {
        try {
            const row = await this.messageRepository.findOne({ where: { sessionId, waMessageId } });
            if (!row)
                return;
            void this.hookManager
                .execute('message:persisted', { sessionId, message: row }, { sessionId, source: 'SessionService' })
                .catch(() => undefined);
        }
        catch (err) {
            this.logger.warn('Failed to read an edited message for message:persisted', {
                sessionId,
                messageId: waMessageId,
                error: String(err),
            });
        }
    }
    async storeReactions(id, waMessageId, changes) {
        await (0, message_metadata_1.updateMessageMetadata)(this.messageRepository, { sessionId: id, waMessageId }, metadata => {
            const reactions = { ...metadata.reactions };
            for (const [sender, reaction] of Object.entries(changes)) {
                if (reaction)
                    reactions[sender] = reaction;
                else
                    delete reactions[sender];
            }
            return { ...metadata, reactions };
        });
    }
    recordRevoke(sessionId, waMessageId, source, announced = false) {
        let stored;
        const pending = this.changeInFlight(sessionId, waMessageId, source, (needsRow, entry) => {
            if (entry && !needsRow) {
                this.holdRevoked(sessionId, entry);
                if (announced)
                    entry.revokeAnnounced = true;
            }
            stored = new Promise(resolve => this.enqueueMessageMutation(sessionId, waMessageId, () => this.revokeRow(sessionId, waMessageId, true, source).finally(resolve)));
        });
        return Promise.resolve(pending).then(() => stored);
    }
    holdRevoked(sessionId, entry) {
        entry.revoked = true;
        for (const t of this.tickets.get(sessionId) ?? [])
            if (t.entry === entry)
                t.giveUp();
    }
    async revokeRow(sessionId, waMessageId, notify = true, source) {
        if (!waMessageId)
            return;
        try {
            const reason = source && (await this.mutationProjector.foreignRowReason(sessionId, waMessageId, source));
            if (reason) {
                this.logger.warn('Dropping a revoke aimed at a message of another chat or sender', {
                    sessionId,
                    messageId: waMessageId,
                    reason,
                });
                return;
            }
            const result = await this.messageRepository.update({ sessionId, waMessageId }, message_row_mapper_1.REVOKED_ROW_PATCH);
            this.markedEdited.get(sessionId)?.delete(waMessageId);
            if (!result?.affected || !notify)
                return;
            const row = await this.messageRepository.findOne({ where: { sessionId, waMessageId } });
            if (!row)
                return;
            void this.hookManager
                .execute('message:persisted', { sessionId, message: row }, { sessionId, source: 'SessionService' })
                .catch(() => undefined);
        }
        catch (err) {
            this.logger.error(`Failed to clear revoked message ${waMessageId}`, String(err));
        }
    }
    dispatchInboundMessage(id, finalMessage, outcome, entry) {
        const { dbMessage, persisted } = outcome;
        if (persisted) {
            void this.hookManager
                .execute('message:persisted', { sessionId: id, message: dbMessage }, { sessionId: id, source: 'SessionService' })
                .catch(() => undefined);
            void this.chatMediaArchive?.archive(dbMessage).catch(() => undefined);
        }
        const announced = this.withChangesMadeInFlight(finalMessage, entry);
        if (!announced)
            return;
        void this.webhookService.dispatch(id, 'message.received', announced);
        void this.automationRules?.evaluateInbound(id, announced).catch(() => undefined);
        this.eventsGateway.emitMessage(id, announced);
    }
    withChangesMadeInFlight(message, pending, rowMarked = false) {
        if (pending?.revokeAnnounced)
            return null;
        if (pending?.revoked || message.type === 'revoked')
            return deletedPlaceholder(message);
        const edited = rowMarked || pending?.edited;
        if (pending?.editedBody === undefined)
            return edited ? { ...message, edited: true } : message;
        return { ...message, body: pending.editedBody, ...(edited ? { edited: true } : {}) };
    }
    handleOwnSendEcho(id, engine, message, ticket) {
        const turn = ticket instanceof InboundTurn ? ticket : undefined;
        try {
            this.receiveOwnSendEcho(id, engine, message, turn);
        }
        finally {
            turn?.drop();
        }
    }
    receiveOwnSendEcho(id, engine, message, turn) {
        if (!this.engines.isLive(id, engine))
            return;
        if (!message.fromMe) {
            return;
        }
        if (message.isStatusBroadcast) {
            return;
        }
        this.logger.debug(`Message sent to ${message.to}`, {
            sessionId: id,
            messageId: message.id,
            to: message.to,
            action: 'message_sent',
        });
        void this.sessionRepository.update(id, { lastActiveAt: new Date() }).catch(() => undefined);
        const messageData = message.type === 'revoked' ? deletedPlaceholder(message) : { ...message };
        delete messageData.originalBody;
        const onFailure = (err) => {
            this.logger.error(`onMessageCreate handler failed for ${id}`, String(err));
            return null;
        };
        const inFlightKey = `${id}:${message.id}`;
        const inFlight = turn
            ? Object.assign(turn.entry, { ref: turn.entry.ref ?? refOf(messageData) })
            : this.trackInFlight(inFlightKey, messageData);
        const delivery = {
            entry: inFlight,
            body: message.originalBody ?? message.body,
            edited: message.originalBody !== undefined,
        };
        const quoteOwner = {};
        const prepared = this.startHookChain(id, engine, turn, messageData, delivery, quoteOwner, messageData => this.hookManager
            .execute('message:sent', messageData, {
            sessionId: id,
            source: 'Engine',
            accept: data => {
                if (!(0, hook_results_1.isMessagePayload)(data))
                    return false;
                if (delivery.entry.quoteOwner === quoteOwner)
                    delivery.entry.quote = quoteOf(data);
                return true;
            },
        })
            .then(({ data }) => this.messageOrEngineCopy(id, 'message:sent', data, messageData))).catch(onFailure);
        this.commitInTurn(id, message, turn, async () => {
            try {
                const finalMessage = await prepared;
                if (finalMessage)
                    await this.commitOwnSendEcho(id, engine, finalMessage, delivery.entry);
            }
            catch (err) {
                onFailure(err);
            }
            finally {
                this.clearQuote(delivery.entry, quoteOwner);
                if (!turn)
                    this.untrackInFlight(inFlightKey, inFlight);
            }
        });
    }
    async commitOwnSendEcho(id, engine, finalMessage, entry) {
        await this.waitForInFlightChanges(id, finalMessage.id);
        if (!this.engines.isLive(id, engine))
            return;
        const outgoing = finalMessage;
        const metadata = (0, message_row_mapper_1.buildMessageMetadata)(outgoing, true);
        const mayPersist = (0, feature_flags_1.resolveFeatureFlags)(this.configService).storeEphemeralMessages ||
            !(outgoing.ephemeralDuration && outgoing.ephemeralDuration > 0);
        let rowMarked = false;
        if (mayPersist) {
            const dbMessage = this.messageRepository.create({
                sessionId: id,
                waMessageId: (0, message_row_mapper_1.storableWaMessageId)(outgoing.id),
                chatId: outgoing.chatId,
                from: outgoing.from,
                to: outgoing.to,
                body: outgoing.body,
                type: outgoing.type,
                direction: message_entity_1.MessageDirection.OUTGOING,
                timestamp: outgoing.timestamp,
                status: message_entity_1.MessageStatus.SENT,
                metadata,
            });
            if (!this.engines.isLive(id, engine))
                return;
            const insertedCleared = this.applyHeldChanges(dbMessage, entry);
            const outcome = await this.insertWithRetry(id, engine, dbMessage, 'outgoing');
            await this.waitForInFlightChanges(id, outgoing.id);
            if (!this.engines.isLive(id, engine))
                return;
            if (outcome.landed === 'stale')
                return;
            if (outcome.landed === 'dup') {
                this.applyChangesMadeInFlight(id, outgoing.id, entry, false, claimOf(outgoing));
                if (outgoing.type === 'revoked')
                    void this.recordRevoke(id, outgoing.id, claimOf(outgoing));
                rowMarked = await new Promise(resolve => this.enqueueMessageMutation(id, outgoing.id, async () => {
                    const marked = this.markedEdited.get(id)?.has(outgoing.id) === true;
                    const foreign = marked && (await this.mutationProjector.foreignRowReason(id, outgoing.id, claimOf(outgoing)));
                    resolve(marked && !foreign);
                }));
            }
            if (outcome.landed === 'yes') {
                this.markedEdited.get(id)?.delete(outgoing.id);
                this.applyChangesMadeInFlight(id, outgoing.id, entry, insertedCleared);
                void this.hookManager
                    .execute('message:persisted', { sessionId: id, message: dbMessage }, { sessionId: id, source: 'SessionService' })
                    .catch(() => undefined);
                if (this.configService?.get('chatMedia.archiveOutbound', false) === true) {
                    void this.chatMediaArchive?.archive(dbMessage).catch(() => undefined);
                }
            }
        }
        if (!this.engines.isLive(id, engine))
            return;
        const sent = this.withChangesMadeInFlight(finalMessage, entry, rowMarked);
        if (!sent)
            return;
        void this.webhookService.dispatch(id, 'message.sent', sent);
        this.eventsGateway.emitMessageSent(id, sent);
    }
    handleMessageAck(id, engine, messageId, status, chatId) {
        if (!this.engines.isLive(id, engine))
            return;
        this.logger.debug(`Message ack: ${messageId} -> ${status}`, {
            sessionId: id,
            messageId,
            status,
            action: 'message_ack',
        });
        const messageStatus = (0, message_status_util_1.deliveryStatusToMessageStatus)(status);
        const inFlight = this.inboundInFlight.get(`${id}:${messageId}`);
        const receiptChat = chatId && !messageId.includes('@') ? chatId : undefined;
        if (receiptChat && inFlight?.ref && (0, message_mutation_guard_1.receiptTargetsForeignRow)(inFlight.ref, receiptChat)) {
            this.logForeignReceipt(id, messageId, receiptChat);
            return;
        }
        if (messageStatus) {
            if (inFlight && (!inFlight.ackStatus || (0, message_status_util_1.ackStatusTransitionFrom)(messageStatus).includes(inFlight.ackStatus))) {
                inFlight.ackStatus = messageStatus;
            }
        }
        const logNoop = () => this.logger.debug(`Message ack ${messageId}: no status row advanced to ${messageStatus} (${status})`, {
            sessionId: id,
            messageId,
            status,
            action: 'message_ack_noop',
        });
        const onAckError = (err) => this.logger.error(`Failed to advance ack for ${messageId}`, String(err));
        const advance = (first, retry = first) => first()
            .then(affected => {
            if (affected > 0)
                return;
            const timer = setTimeout(() => {
                void retry()
                    .then(retried => {
                    if (retried === 0)
                        logNoop();
                })
                    .catch(onAckError);
            }, exports.ACK_RECONCILE_DELAY_MS);
            timer.unref?.();
        })
            .catch(onAckError);
        const ackPayload = {
            id: messageId,
            messageId,
            status,
            ack: (0, message_status_util_1.deliveryStatusToAck)(status),
            ...(chatId ? { chatId } : {}),
        };
        const announce = () => {
            this.eventsGateway.emitMessageAck(id, ackPayload);
            void this.webhookService.dispatch(id, 'message.ack', ackPayload);
            if (status === 'failed') {
                void this.webhookService.dispatch(id, 'message.failed', { ...ackPayload });
            }
            void this.hookManager.execute('message:ack', { messageId, status, ack: (0, message_status_util_1.deliveryStatusToAck)(status) }, { sessionId: id, source: 'Engine' });
        };
        if (!receiptChat) {
            if (messageStatus)
                void advance(() => this.advanceAck(id, messageId, messageStatus));
            announce();
            return;
        }
        this.enqueueMessageMutation(id, messageId, async () => {
            const verdict = await this.receiptVerdict(id, messageId, receiptChat);
            if (verdict === 'foreign' || !this.engines.isLive(id, engine))
                return;
            announce();
            if (!messageStatus)
                return;
            const target = messageStatus;
            const judged = async () => (await this.receiptVerdict(id, messageId, receiptChat)) === 'stored'
                ? this.advanceAck(id, messageId, target)
                : 0;
            await advance(verdict === 'stored' ? () => this.advanceAck(id, messageId, target) : () => Promise.resolve(0), judged);
        });
    }
    async receiptVerdict(id, messageId, chatId) {
        try {
            const row = await this.messageRepository.findOne({
                where: { sessionId: id, waMessageId: messageId },
                select: { chatId: true, direction: true, author: true },
            });
            if (!row)
                return 'absent';
            const foreign = await (0, message_mutation_guard_1.receiptTargetsForeignRowPersisted)(row, chatId, this.lidMappingStore ? jid => this.lidMappingStore.findPhoneForLid(jid) : undefined);
            if (!foreign)
                return 'stored';
            this.logForeignReceipt(id, messageId, chatId);
            return 'foreign';
        }
        catch {
            return 'absent';
        }
    }
    logForeignReceipt(id, messageId, chatId) {
        this.logger.warn('Dropping a receipt that names a message of another chat', {
            sessionId: id,
            messageId,
            chatId,
            action: 'message_ack_foreign_chat',
        });
    }
    handleMessageReceipt(id, engine, event) {
        if (!this.engines.isLive(id, engine))
            return;
        const payload = {
            id: event.messageId,
            messageId: event.messageId,
            chatId: event.chatId,
            participant: event.participant,
            status: event.status,
            timestamp: event.timestamp,
        };
        this.eventsGateway.emitMessageReceipt(id, payload);
        void this.webhookService.dispatch(id, 'message.receipt', payload);
    }
    advanceAck(id, messageId, messageStatus) {
        return this.messageRepository
            .update({ sessionId: id, waMessageId: messageId, status: (0, typeorm_2.In)((0, message_status_util_1.ackStatusTransitionFrom)(messageStatus)) }, { status: messageStatus })
            .then(result => result.affected ?? 0);
    }
    handleMessageRevoked(id, engine, message, actor) {
        if (!this.engines.isLive(id, engine))
            return;
        this.logger.debug(`Message revoked: ${message.id}`, {
            sessionId: id,
            messageId: message.id,
            action: 'message_revoked',
        });
        const revokedWaMessageId = message.revokedId ?? message.id;
        const source = actor ? { kind: 'revoke', chatId: message.chatId, fromMe: actor.fromMe } : undefined;
        const apply = () => {
            void this.recordRevoke(id, revokedWaMessageId, source, true);
            const revokedPayload = message;
            void this.webhookService.dispatch(id, 'message.revoked', revokedPayload);
            this.eventsGateway.emitMessageRevoked(id, revokedPayload);
        };
        if (!source) {
            apply();
            return;
        }
        void this.changeInFlight(id, revokedWaMessageId, source, (needsRow, inFlight) => {
            if (inFlight && !needsRow) {
                this.holdRevoked(id, inFlight);
                inFlight.revokeAnnounced = true;
            }
            void this.mutationProjector.storedRowVerdict(id, revokedWaMessageId, source).then(verdict => {
                if (!this.engines.isLive(id, engine))
                    return;
                if (verdict.reason || (needsRow && !verdict.exists)) {
                    if (verdict.reason) {
                        this.logger.warn('Dropping a revoke aimed at a message of another chat or sender', {
                            sessionId: id,
                            messageId: revokedWaMessageId,
                            reason: verdict.reason,
                        });
                    }
                    return;
                }
                apply();
            });
        });
    }
    persistHistoryMessages(id, engine, messages) {
        return (0, message_history_projector_1.persistHistoryMessages)(this.messageRepository, this.configService, id, messages, this.logger, () => this.engines.isLive(id, engine), row => {
            if (!this.engines.isLive(id, engine))
                return;
            void this.hookManager
                .execute('message:persisted', { sessionId: id, message: row }, { sessionId: id, source: 'SessionService' })
                .catch(() => undefined);
        }, this.lidMappingStore ? jid => this.lidMappingStore.findPhoneForLid(jid) : undefined);
    }
    applyReactionQueued(id, event) {
        void this.changeInFlight(id, event.messageId, { kind: 'reaction', chatId: event.chatId }, (needsRow, entry) => {
            if (entry && !needsRow)
                (entry.reactions ??= {})[event.senderId] = event.reaction ?? '';
            this.mutationProjector.applyReactionQueued(id, event, needsRow);
        });
    }
    applyMessageEditQueued(id, message) {
        const source = { kind: 'edit', chatId: message.chatId, fromMe: message.fromMe, author: message.author };
        void this.changeInFlight(id, message.messageId, source, (needsRow, entry) => {
            if (entry && !needsRow && entry.revoked)
                return;
            if (entry && !needsRow)
                this.holdEdit(entry, message.body);
            this.mutationProjector.applyMessageEditQueued(id, message, needsRow);
        });
    }
    changeInFlight(id, messageId, source, ready) {
        const key = `${id}:${messageId}`;
        const entry = this.inboundInFlight.get(key);
        const foreign = entry?.ref && source?.chatId ? (0, message_mutation_guard_1.mutationTargetsForeignRow)(entry.ref, source) : null;
        if (!entry?.changes?.pending && (!foreign || !this.lidMappingStore)) {
            ready(foreign !== null, entry);
            return;
        }
        const changes = (entry.changes ??= {});
        const ref = entry.ref;
        const engine = this.engines.get(id);
        const pending = (changes.pending ?? Promise.resolve())
            .then(async () => {
            if (this.engines.get(id) !== engine)
                return;
            const current = this.inboundInFlight.get(key);
            if (current?.changes !== changes || current.ref !== ref)
                return;
            const reason = current.ref && source?.chatId
                ? await (0, message_mutation_guard_1.mutationTargetsForeignRowPersisted)(current.ref, source, this.lidMappingStore ? jid => this.lidMappingStore.findPhoneForLid(jid) : undefined)
                : null;
            const target = this.inboundInFlight.get(key);
            if (this.engines.get(id) !== engine || target?.changes !== changes || target.ref !== ref)
                return;
            ready(reason !== null, target);
        })
            .catch(err => {
            this.logger.warn('Unable to prepare a change for an arriving message', { error: String(err) });
        });
        changes.pending = pending;
        void pending.finally(() => {
            if (changes.pending === pending)
                delete changes.pending;
        });
        return pending;
    }
    waitForInFlightChanges(id, messageId) {
        const key = `${id}:${messageId}`;
        if (!this.inboundInFlight.get(key)?.changes?.pending)
            return;
        return (async () => {
            let pending;
            while ((pending = this.inboundInFlight.get(key)?.changes?.pending))
                await pending;
        })();
    }
    enqueueMessageMutation(id, messageId, work) {
        this.mutationProjector.enqueueMessageMutation(id, messageId, work);
    }
    recordOutboundMessageEdit(sessionId, messageId, body, source) {
        let stored;
        const pending = this.changeInFlight(sessionId, messageId, source, (needsRow, entry) => {
            if (entry && !needsRow) {
                this.holdEdit(entry, body);
                entry.edited = true;
            }
            stored = this.mutationProjector.recordOutboundMessageEdit(sessionId, messageId, body, source);
        });
        return Promise.resolve(pending).then(() => stored);
    }
    dispatchStatusReceived(sessionId, row) {
        const payload = {
            sessionId,
            statusId: row.waStatusId,
            contact: {
                id: row.contactJid,
                ...(row.contactName ? { name: row.contactName } : {}),
                ...(row.contactPushName ? { pushName: row.contactPushName } : {}),
            },
            type: row.type,
            ...(row.caption ? { caption: row.caption } : {}),
            hasMedia: Boolean(row.mediaPath) && !row.mediaOmitted,
            mediaOmitted: row.mediaOmitted,
            ...(row.omitReason ? { omitReason: row.omitReason } : {}),
            postedAt: row.postedAt,
            expiresAt: row.expiresAt,
        };
        void this.webhookService.dispatch(sessionId, 'status.received', payload);
        this.eventsGateway.emitStatusReceived(sessionId, payload);
    }
};
exports.MessageProjector = MessageProjector;
exports.MessageProjector = MessageProjector = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(message_entity_1.Message, 'data')),
    __param(1, (0, typeorm_1.InjectRepository)(session_entity_1.Session, 'data')),
    __param(8, (0, common_1.Optional)()),
    __param(9, (0, common_1.Optional)()),
    __param(10, (0, common_1.Optional)()),
    __param(11, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        engine_registry_service_1.EngineRegistry,
        events_gateway_1.EventsGateway,
        webhook_service_1.WebhookService,
        hooks_1.HookManager,
        status_store_service_1.StatusStoreService,
        session_lid_resolver_service_1.SessionLidResolver,
        config_1.ConfigService,
        chat_media_archive_service_1.ChatMediaArchiveService,
        automation_rules_service_1.AutomationRulesService,
        lid_mapping_store_service_1.LidMappingStoreService])
], MessageProjector);
//# sourceMappingURL=message-projector.service.js.map