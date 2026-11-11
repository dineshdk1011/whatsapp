"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KNOWN_HOOK_EVENTS = void 0;
exports.isKnownHookEvent = isKnownHookEvent;
const HOOK_EVENT_REGISTRY = {
    'session:created': true,
    'session:starting': true,
    'session:ready': true,
    'session:qr': true,
    'session:disconnected': true,
    'session:error': true,
    'session:deleted': true,
    'message:received': true,
    'message:sending': true,
    'message:sent': true,
    'message:failed': true,
    'message:ack': true,
    'message:persisted': true,
    'message:deleted': true,
    'webhook:before': true,
    'webhook:queued': true,
    'webhook:delivered': true,
    'webhook:after': true,
    'webhook:error': true,
    'ingress:error': true,
};
exports.KNOWN_HOOK_EVENTS = new Set(Object.keys(HOOK_EVENT_REGISTRY));
function isKnownHookEvent(event) {
    return exports.KNOWN_HOOK_EVENTS.has(event);
}
//# sourceMappingURL=hook.interfaces.js.map