"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateIdempotencyKey = generateIdempotencyKey;
exports.generateDeliveryId = generateDeliveryId;
const crypto_1 = require("crypto");
function toStr(value, fallback = 'unknown') {
    if (value === null || value === undefined)
        return fallback;
    if (typeof value === 'string')
        return value;
    if (typeof value === 'number' || typeof value === 'boolean')
        return String(value);
    return fallback;
}
function hashData(data) {
    const str = JSON.stringify(data, Object.keys(data).sort());
    return (0, crypto_1.createHash)('sha256').update(str).digest('hex').substring(0, 12);
}
function generateIdempotencyKey(event, data, occurrenceId) {
    const occurrence = occurrenceId ? `_${occurrenceId}` : '';
    switch (event) {
        case 'message.received':
        case 'message.sent':
            return `msg_${toStr(data.sessionId)}_${toStr(data.id ?? data.messageId)}`;
        case 'message.ack':
            return `ack_${toStr(data.sessionId)}_${toStr(data.id ?? data.messageId)}_${toStr(data.status ?? data.ack, '0')}`;
        case 'message.receipt':
            return `receipt_${toStr(data.sessionId)}_${toStr(data.id ?? data.messageId)}_${toStr(data.participant)}_${toStr(data.status)}`;
        case 'message.failed':
            return `failed_${toStr(data.sessionId)}_${toStr(data.id ?? data.messageId)}_${toStr(data.status ?? data.ack, '0')}`;
        case 'message.revoked':
            return `rev_${toStr(data.sessionId)}_${toStr(data.id ?? data.messageId)}`;
        case 'message.edited':
            return `edit_${toStr(data.sessionId)}_${toStr(data.messageId)}${occurrence}`;
        case 'message.reaction':
            return `react_${toStr(data.sessionId)}_${toStr(data.messageId)}_${toStr(data.senderId)}${occurrence}`;
        case 'session.status':
            return `sess_${toStr(data.sessionId)}_${toStr(data.status)}${occurrence}`;
        case 'session.qr':
            return `qr_${toStr(data.sessionId)}_${hashData({ qr: data.qr })}`;
        case 'session.authenticated':
            return `auth_${toStr(data.sessionId)}_${hashData(data)}${occurrence}`;
        case 'session.disconnected':
            return `disc_${toStr(data.sessionId)}_${hashData({ reason: data.reason })}${occurrence}`;
        case 'session.reconnect_loop':
            return `loop_${toStr(data.sessionId)}_${toStr(data.attempts)}${occurrence}`;
        case 'session.restriction':
            return `restr_${toStr(data.sessionId)}_${toStr(data.kind)}_${toStr(data.active)}${occurrence}`;
        case 'call.accepted':
        case 'call.rejected':
        case 'call.missed':
            return `call_${toStr(data.sessionId)}_${toStr(data.callId)}_${toStr(data.outcome)}`;
        case 'event.response':
            return `rsvp_${toStr(data.sessionId)}_${toStr(data.responseMessageId)}`;
        case 'poll.vote':
            return `vote_${toStr(data.sessionId)}_${toStr(data.pollMessageId)}_${toStr(data.voterId)}_${toStr(data.timestampMs ?? data.timestamp)}_${hashData({ selectedOptions: data.selectedOptions ?? null })}`;
        case 'presence.update':
            return `pres_${toStr(data.sessionId)}_${toStr(data.chatId)}_${hashData({ participants: JSON.stringify(data.participants ?? null) })}${occurrence}`;
        case 'group.join':
            return `grp_${toStr(data.groupId)}_${hashData({ participants: data.participantIds })}_join${occurrence}`;
        case 'group.leave':
            return `grp_${toStr(data.groupId)}_${hashData({ participants: data.participantIds })}_leave${occurrence}`;
        case 'group.join_request':
            return `grp_${toStr(data.groupId)}_${hashData({ participants: data.participantIds })}_join_request${occurrence}`;
        case 'group.update':
            return `grp_${toStr(data.groupId)}_update_${hashData({ changes: JSON.stringify(data.changes ?? null) })}${occurrence}`;
        case 'call.received':
            return `call_${toStr(data.sessionId)}_${toStr(data.callId)}`;
        default:
            return `evt_${event.replace(/\./g, '_')}_${hashData(data)}`;
    }
}
function generateDeliveryId() {
    return `dlv_${(0, crypto_1.randomUUID)()}`;
}
//# sourceMappingURL=idempotency.util.js.map