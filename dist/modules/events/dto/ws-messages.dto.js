"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUBSCRIBABLE_EVENTS = void 0;
exports.buildRoomName = buildRoomName;
exports.SUBSCRIBABLE_EVENTS = [
    'message.received',
    'message.sent',
    'message.ack',
    'message.receipt',
    'message.revoked',
    'message.reaction',
    'message.edited',
    'session.status',
    'session.qr',
    'session.authenticated',
    'session.disconnected',
    'session.restriction',
    'group.join',
    'group.leave',
    'group.update',
    'group.join_request',
    'call.received',
    'status.received',
    'presence.update',
    'event.response',
    'poll.vote',
    'call.accepted',
    'call.rejected',
    'call.missed',
];
function buildRoomName(sessionId, event) {
    return `session:${sessionId}:${event}`;
}
//# sourceMappingURL=ws-messages.dto.js.map