export declare const SUBSCRIBABLE_EVENTS: readonly ["message.received", "message.sent", "message.ack", "message.receipt", "message.revoked", "message.reaction", "message.edited", "session.status", "session.qr", "session.authenticated", "session.disconnected", "session.restriction", "group.join", "group.leave", "group.update", "group.join_request", "call.received", "status.received", "presence.update", "event.response", "poll.vote", "call.accepted", "call.rejected", "call.missed"];
export interface WSSubscribeRequest {
    type: 'subscribe';
    sessionId: string;
    events: string[];
    requestId?: string;
}
export interface WSUnsubscribeRequest {
    type: 'unsubscribe';
    sessionId: string;
    requestId?: string;
}
export interface WSPingRequest {
    type: 'ping';
    requestId?: string;
}
export type WSClientMessage = WSSubscribeRequest | WSUnsubscribeRequest | WSPingRequest;
export interface WSSubscribedResponse {
    type: 'subscribed';
    sessionId: string;
    events: string[];
    requestId?: string;
    timestamp: string;
}
export interface WSUnsubscribedResponse {
    type: 'unsubscribed';
    sessionId: string;
    requestId?: string;
    timestamp: string;
}
export interface WSEventMessage {
    type: 'event';
    payload: {
        event: string;
        sessionId: string;
        data: unknown;
    };
    timestamp: string;
}
export interface WSErrorResponse {
    type: 'error';
    code: string;
    message: string;
    requestId?: string;
    timestamp: string;
}
export interface WSPongResponse {
    type: 'pong';
    requestId?: string;
    timestamp: string;
}
export declare function buildRoomName(sessionId: string, event: string): string;
