"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerWwebjsMessageEvents = registerWwebjsMessageEvents;
const crypto_1 = require("crypto");
const whatsapp_web_js_1 = require("whatsapp-web.js");
const whatsapp_web_js_types_1 = require("../types/whatsapp-web-js.types");
const message_mapper_1 = require("./message-mapper");
const wwebjs_messaging_1 = require("./wwebjs-messaging");
const inbound_media_cap_1 = require("./inbound-media-cap");
const MAX_MESSAGES_IN_PROCESSING = 5_000;
const MAX_CHANGES_KEPT_PER_MESSAGE = 64;
const NOT_KEPT = { handOver: () => true, end: () => undefined };
function registerWwebjsMessageEvents(client, host) {
    const admit = (msg, base, mayDownload) => (0, inbound_media_cap_1.admitInboundSafely)(() => host.getCallbacks().admitInbound?.({
        id: base.id,
        chatId: base.chatId,
        status: Boolean(base.isStatusBroadcast),
        needsRoom: mayDownload && (0, wwebjs_messaging_1.plannedInboundDownload)(msg),
        fromMe: base.fromMe,
        ...(base.author ? { author: base.author } : {}),
    }), error => host.logger.error(`Could not admit inbound message ${base.id}; processing it without room for media`, String(error)));
    const holdWhileProcessing = (ticket, done) => {
        ticket?.holdUntil(done);
        void done.then(() => ticket?.drop(), () => ticket?.drop());
    };
    const inProcessing = new Map();
    const deliverKept = (kept) => {
        for (const deliver of kept.changes.splice(0)) {
            try {
                deliver();
            }
            catch (error) {
                host.logger.error('Error delivering a change that reached a message while it was processed', String(error));
            }
        }
    };
    const keepChanges = (message, ticket) => {
        if (ticket || !message.id || message.isStatusBroadcast)
            return NOT_KEPT;
        let kept = inProcessing.get(message.id);
        if (message.type === 'revoked') {
            if (kept)
                kept.deleted = true;
            return NOT_KEPT;
        }
        if (!kept) {
            if (inProcessing.size >= MAX_MESSAGES_IN_PROCESSING)
                return NOT_KEPT;
            kept = {
                text: message.body,
                arrived: message.body,
                edited: false,
                deleted: false,
                deliveries: 0,
                delivered: false,
                changes: [],
            };
            inProcessing.set(message.id, kept);
        }
        const mine = kept;
        mine.deliveries++;
        return {
            handOver: handedOver => {
                if (mine.deleted)
                    return false;
                if (mine.edited)
                    handedOver.originalBody = mine.arrived;
                handedOver.body = mine.text;
                return true;
            },
            end: () => {
                mine.deliveries--;
                mine.delivered = true;
                if (!mine.deliveries && inProcessing.get(message.id) === mine)
                    inProcessing.delete(message.id);
                deliverKept(mine);
            },
        };
    };
    const afterMessage = (messageId, deliver, change = {}) => {
        const kept = inProcessing.get(messageId);
        if (!kept || change.editedText === kept.text) {
            deliver();
            return;
        }
        if (change.editedText !== undefined) {
            kept.text = change.editedText;
            kept.edited = true;
        }
        if (change.deletes)
            kept.deleted = true;
        if (!kept.delivered && kept.changes.length < MAX_CHANGES_KEPT_PER_MESSAGE) {
            kept.changes.push(deliver);
            return;
        }
        deliverKept(kept);
        deliver();
    };
    const decryptedLater = new Map();
    const fingerprint = (text) => (0, crypto_1.createHash)('sha256').update(text).digest('base64');
    const isDecryption = (edit) => {
        if (!decryptedLater.has(edit.messageId))
            return false;
        const delivered = decryptedLater.get(edit.messageId);
        decryptedLater.delete(edit.messageId);
        return delivered === undefined || delivered === fingerprint(edit.body);
    };
    const deliveredDecrypted = (message) => {
        if (decryptedLater.has(message.id))
            decryptedLater.set(message.id, fingerprint(message.body));
    };
    client.on('message_ciphertext', msg => {
        const id = (0, whatsapp_web_js_types_1.readWid)(msg.id);
        const subtype = msg.rawData?.subtype;
        if (!id || subtype?.endsWith('_unavailable_fanout'))
            return;
        decryptedLater.set(id, undefined);
        if (decryptedLater.size > MAX_MESSAGES_IN_PROCESSING)
            decryptedLater.delete(decryptedLater.keys().next().value);
    });
    client.on('message', msg => {
        let base;
        try {
            base = (0, message_mapper_1.buildIncomingMessageBase)(msg);
        }
        catch (error) {
            host.logger.error('Error processing incoming message', String(error));
            return;
        }
        deliveredDecrypted(base);
        const ticket = admit(msg, base, true);
        const processing = keepChanges(base, ticket);
        const done = handleIncoming(host, msg, base, ticket, processing);
        holdWhileProcessing(ticket, done);
        void done.then(processing.end, processing.end);
    });
    client.on('message_create', msg => {
        if (!msg.fromMe) {
            return;
        }
        let ticket;
        let processing = NOT_KEPT;
        const done = (async () => {
            let incomingMessage;
            try {
                incomingMessage = (0, message_mapper_1.buildIncomingMessageBase)(msg);
            }
            catch (error) {
                host.logger.error('Error processing outgoing message', String(error));
                return;
            }
            deliveredDecrypted(incomingMessage);
            ticket = admit(msg, incomingMessage, !incomingMessage.isStatusBroadcast);
            processing = keepChanges(incomingMessage, ticket);
            if (msg.hasMedia && !incomingMessage.isStatusBroadcast) {
                try {
                    incomingMessage.media = await host.capInboundMediaFor(msg, undefined, ticket);
                }
                catch (error) {
                    host.logger.warn('Own-send media download failed; emitting echo without media', {
                        msgId: msg.id?._serialized,
                        error: String(error),
                    });
                }
            }
            try {
                if (!processing.handOver(incomingMessage)) {
                    host.logger.debug('Not handing over an own message deleted for everyone while it was processed', {
                        msgId: incomingMessage.id,
                    });
                    return;
                }
                if (ticket)
                    host.getCallbacks().onMessageCreate?.(incomingMessage, ticket);
                else
                    host.getCallbacks().onMessageCreate?.(incomingMessage);
            }
            catch (error) {
                host.logger.error('Error processing outgoing message', String(error));
            }
        })();
        holdWhileProcessing(ticket, done);
        void done.then(() => processing.end(), () => processing.end());
    });
    client.on('message_ack', (msg, ack) => {
        const rawId = msg.id;
        const ackId = (0, whatsapp_web_js_types_1.readWid)(rawId);
        if (!ackId) {
            host.logger.warn('Dropping an ack whose message id could not be read', { ack });
            return;
        }
        if (msg.fromMe === false)
            return;
        const ackChatId = msg.fromMe ? msg.to : msg.from;
        host.getCallbacks().onMessageAck?.(ackId, (0, wwebjs_messaging_1.wwebjsAckToDeliveryStatus)(ack), ackChatId || undefined);
    });
    client.on('message_revoke_everyone', (after, before) => {
        try {
            const afterId = after.id;
            const beforeId = before?.id;
            const payload = {
                id: (0, whatsapp_web_js_types_1.readWid)(afterId) ?? '',
                revokedId: (0, whatsapp_web_js_types_1.readWid)(beforeId),
                chatId: after.fromMe ? after.to : after.from,
                from: after.from,
                to: after.to,
                type: 'revoked',
                body: '',
                timestamp: after.timestamp,
            };
            afterMessage(payload.revokedId ?? payload.id, () => host.getCallbacks().onMessageRevoked?.(payload), {
                deletes: true,
            });
        }
        catch (error) {
            host.logger.error('Error processing message_revoke_everyone', String(error));
        }
    });
    client.on('message_reaction', reaction => {
        try {
            const msgId = reaction.msgId;
            const event = {
                messageId: (0, whatsapp_web_js_types_1.readWid)(msgId) ?? '',
                chatId: reaction.id.remote,
                reaction: reaction.reaction,
                senderId: reaction.senderId,
            };
            afterMessage(event.messageId, () => host.getCallbacks().onMessageReaction?.(event));
        }
        catch (error) {
            host.logger.error('Error processing message_reaction', String(error));
        }
    });
    client.on('vote_update', vote => {
        try {
            const raw = vote;
            const poll = vote.parentMessage;
            const pollId = poll?.id;
            const selectedOptions = (vote.selectedOptions ?? [])
                .map(option => option.name)
                .filter((name) => typeof name === 'string');
            if ((vote.selectedOptions?.length ?? 0) > 0 && selectedOptions.length === 0) {
                host.logger.debug('Ignoring a poll vote whose options WhatsApp Web cannot name', {
                    pollMessageId: (0, whatsapp_web_js_types_1.readWid)(pollId) ?? (0, whatsapp_web_js_types_1.readWid)(raw.parentMsgKey),
                });
                return;
            }
            const interactedAtMs = Math.floor(Number(vote.interractedAtTs) || Date.now());
            const event = {
                pollMessageId: (0, whatsapp_web_js_types_1.readWid)(pollId) ?? (0, whatsapp_web_js_types_1.readWid)(raw.parentMsgKey) ?? '',
                chatId: (poll?.from ? (poll.fromMe ? poll.to : poll.from) : (0, whatsapp_web_js_types_1.readWid)(raw.parentMsgKey?.remote)) ?? '',
                voterId: (0, whatsapp_web_js_types_1.readWid)(raw.voter) ?? '',
                selectedOptions,
                ...(poll?.pollName ? { pollName: poll.pollName } : {}),
                timestamp: Math.floor(interactedAtMs / 1000),
                timestampMs: interactedAtMs,
            };
            host.getCallbacks().onPollVote?.(event);
        }
        catch (error) {
            host.logger.error('Error processing vote_update', String(error));
        }
    });
    client.on('message_edit', (message, newBody) => {
        try {
            if ((message.type !== whatsapp_web_js_1.MessageTypes.TEXT && !message.hasMedia) || String(newBody ?? '') !== message.body) {
                host.logger.debug('Ignoring a message_edit that is no edit of a text or caption', {
                    msgId: message.id?._serialized,
                    type: message.type,
                });
                return;
            }
            const editTimestamp = Math.floor(Date.now() / 1000);
            const base = (0, message_mapper_1.buildIncomingMessageBase)({
                id: message.id,
                from: message.from,
                to: message.to,
                body: message.body,
                type: message.type,
                timestamp: editTimestamp,
                fromMe: message.fromMe,
                author: message.author,
                mentionedIds: message.mentionedIds,
            });
            const payload = (0, message_mapper_1.buildEditedMessage)(base, Boolean(message.hasMedia));
            if (isDecryption(payload)) {
                host.logger.debug('Ignoring the message_edit of a message decrypted in place', { msgId: payload.messageId });
                return;
            }
            afterMessage(payload.messageId, () => host.getCallbacks().onMessageEdited?.(payload), {
                editedText: payload.body,
            });
        }
        catch (error) {
            host.logger.error('Error processing message_edit', String(error));
        }
    });
}
async function handleIncoming(host, msg, incomingMessage, ticket, processing) {
    const lookup = (what, call) => ticket
        ? (0, inbound_media_cap_1.withInboundDownloadTimeout)(call, (0, inbound_media_cap_1.inboundMediaTimeoutMs)(), () => host.logger.warn(`Getting the ${what} passed MEDIA_DOWNLOAD_TIMEOUT_MS; emitting without it`, {
            msgId: incomingMessage.id,
        }))
        : call;
    try {
        try {
            const contact = await lookup('message contact', msg.getContact());
            if (contact) {
                const full = process.env.WEBHOOK_CONTACT_DETAILS === 'true';
                const merged = { ...incomingMessage.contact, ...(0, message_mapper_1.mapContactFields)(contact, full) };
                if (Object.keys(merged).length > 0) {
                    incomingMessage.contact = merged;
                }
            }
        }
        catch (error) {
            host.logger.error('Error getting message contact', String(error));
        }
        if (msg.type === whatsapp_web_js_1.MessageTypes.LOCATION && msg.location) {
            incomingMessage.location = {
                latitude: Number(msg.location.latitude),
                longitude: Number(msg.location.longitude),
                description: msg.location.description || undefined,
                address: msg.location.address || undefined,
                url: msg.location.url || undefined,
            };
        }
        if (msg.hasMedia) {
            try {
                const capped = await host.capInboundMediaFor(msg, undefined, ticket);
                if (capped)
                    incomingMessage.media = capped;
            }
            catch (error) {
                host.logger.error('Error downloading media', String(error));
            }
        }
        if (msg.hasQuotedMsg) {
            try {
                const quoted = await lookup('quoted message', msg.getQuotedMessage());
                if (quoted) {
                    incomingMessage.quotedMessage = {
                        id: quoted.id._serialized,
                        body: quoted.body,
                    };
                }
            }
            catch (error) {
                host.logger.error('Error getting quoted message', String(error));
            }
        }
        const call = (0, wwebjs_messaging_1.extractWwebjsCall)(msg);
        if (call)
            incomingMessage.call = call;
        if (!processing.handOver(incomingMessage)) {
            host.logger.debug('Not handing over a message deleted for everyone while it was processed', {
                msgId: incomingMessage.id,
            });
            return;
        }
        if (ticket)
            host.getCallbacks().onMessage?.(incomingMessage, ticket);
        else
            host.getCallbacks().onMessage?.(incomingMessage);
    }
    catch (error) {
        host.logger.error('Error processing incoming message', String(error));
    }
}
//# sourceMappingURL=wwebjs-message-events.js.map