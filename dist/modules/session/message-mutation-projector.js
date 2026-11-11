"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageMutationProjector = void 0;
const typeorm_1 = require("typeorm");
const message_metadata_1 = require("../message/message-metadata");
const message_mutation_guard_1 = require("./message-mutation-guard");
class MessageMutationProjector {
    messageRepository;
    eventsGateway;
    webhookService;
    messageMutations;
    logger;
    onMarkedEdited;
    resolveLid;
    onTextChanged;
    constructor(messageRepository, eventsGateway, webhookService, messageMutations, logger, onMarkedEdited = () => undefined, resolveLid, onTextChanged = () => Promise.resolve()) {
        this.messageRepository = messageRepository;
        this.eventsGateway = eventsGateway;
        this.webhookService = webhookService;
        this.messageMutations = messageMutations;
        this.logger = logger;
        this.onMarkedEdited = onMarkedEdited;
        this.resolveLid = resolveLid;
        this.onTextChanged = onTextChanged;
    }
    applyReactionQueued(id, event, needsRow = false) {
        this.enqueueMessageMutation(id, event.messageId, () => this.applyReaction(id, event, needsRow));
    }
    applyMessageEditQueued(id, message, needsRow = false) {
        this.enqueueMessageMutation(id, message.messageId, () => this.applyMessageEdit(id, message, needsRow));
    }
    enqueueMessageMutation(id, messageId, work) {
        this.messageMutations.enqueue(`${id}:${messageId}`, work);
    }
    async foreignRowReason(sessionId, waMessageId, source) {
        return (await this.storedRowVerdict(sessionId, waMessageId, source)).reason;
    }
    async storedRowVerdict(sessionId, waMessageId, source) {
        if (!waMessageId)
            return { exists: false, reason: null };
        try {
            const row = await this.messageRepository.findOne({
                where: { sessionId, waMessageId },
                select: { chatId: true, direction: true, author: true },
            });
            return row
                ? { exists: true, reason: await (0, message_mutation_guard_1.mutationTargetsForeignRowPersisted)(row, source, this.resolveLid) }
                : { exists: false, reason: null };
        }
        catch {
            return { exists: false, reason: null };
        }
    }
    async applyReaction(id, event, needsRow) {
        try {
            if (!event.messageId)
                return;
            const verdict = await this.storedRowVerdict(id, event.messageId, { kind: 'reaction', chatId: event.chatId });
            if (needsRow && !verdict.exists)
                return;
            if (verdict.reason) {
                this.logger.warn('Dropping a reaction aimed at a message of another chat', {
                    sessionId: id,
                    messageId: event.messageId,
                    reason: verdict.reason,
                });
                return;
            }
            const metadata = await (0, message_metadata_1.updateMessageMetadata)(this.messageRepository, { sessionId: id, waMessageId: event.messageId }, current => {
                const reactions = { ...current.reactions };
                if (!event.reaction)
                    delete reactions[event.senderId];
                else
                    reactions[event.senderId] = event.reaction;
                return { ...current, reactions };
            }).catch((err) => {
                this.logger.error(`Failed to update message reaction: ${event.messageId}`, String(err));
                return null;
            });
            const reactions = metadata?.reactions;
            const payload = reactions ? { ...event, reactions } : { ...event };
            this.eventsGateway.emitMessageReaction(id, payload);
            void this.webhookService.dispatch(id, 'message.reaction', payload);
        }
        catch (err) {
            this.logger.error(`Failed to update message reaction: ${event.messageId}`, String(err));
        }
    }
    async applyMessageEdit(id, message, needsRow) {
        const verdict = await this.storedRowVerdict(id, message.messageId, {
            kind: 'edit',
            chatId: message.chatId,
            fromMe: message.fromMe,
            author: message.author,
        });
        if (needsRow && !verdict.exists)
            return;
        if (verdict.reason) {
            this.logger.warn('Dropping an edit aimed at a message of another chat or sender', {
                sessionId: id,
                messageId: message.messageId,
                reason: verdict.reason,
            });
            return;
        }
        let revoked = false;
        try {
            const result = await this.messageRepository.update({ sessionId: id, waMessageId: message.messageId, type: (0, typeorm_1.Not)('revoked'), body: (0, typeorm_1.Or)((0, typeorm_1.Not)(message.body), (0, typeorm_1.IsNull)()) }, { body: message.body });
            if (result.affected) {
                await this.markMessageEdited(id, message.messageId);
                await this.onTextChanged(id, message.messageId);
            }
            else {
                revoked =
                    (await this.messageRepository.findOne({
                        where: { sessionId: id, waMessageId: message.messageId, type: 'revoked' },
                        select: { id: true },
                    })) !== null;
            }
        }
        catch (err) {
            this.logger.error(`Failed to update edited message: ${message.messageId}`, String(err));
        }
        if (revoked)
            return;
        const editedPayload = message;
        this.eventsGateway.emitMessageEdited(id, editedPayload);
        void this.webhookService.dispatch(id, 'message.edited', editedPayload);
    }
    async markMessageEdited(sessionId, waMessageId) {
        const marked = await (0, message_metadata_1.updateMessageMetadata)(this.messageRepository, { sessionId, waMessageId }, metadata => ({
            ...metadata,
            edited: true,
        }));
        if (marked)
            this.onMarkedEdited(sessionId, waMessageId);
    }
    async recordOutboundMessageEdit(sessionId, messageId, body, source) {
        await new Promise(resolve => {
            this.enqueueMessageMutation(sessionId, messageId, async () => {
                try {
                    const reason = source && (await this.foreignRowReason(sessionId, messageId, source));
                    if (reason) {
                        this.logger.warn('Not storing an edit aimed at a message of another chat or sender', {
                            sessionId,
                            messageId,
                            reason,
                        });
                        return;
                    }
                    const result = await this.messageRepository.update({ sessionId, waMessageId: messageId, type: (0, typeorm_1.Not)('revoked'), body: (0, typeorm_1.Or)((0, typeorm_1.Not)(body), (0, typeorm_1.IsNull)()) }, { body });
                    await this.markMessageEdited(sessionId, messageId);
                    if (result?.affected)
                        await this.onTextChanged(sessionId, messageId);
                }
                catch (err) {
                    this.logger.warn(`Failed to update stored body of edited message ${messageId}`, { error: String(err) });
                }
                finally {
                    resolve();
                }
            });
        });
    }
}
exports.MessageMutationProjector = MessageMutationProjector;
//# sourceMappingURL=message-mutation-projector.js.map