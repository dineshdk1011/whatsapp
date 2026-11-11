"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WILDCARD_EXCLUDED_EVENTS = void 0;
exports.subscriptionCoversEvent = subscriptionCoversEvent;
exports.WILDCARD_EXCLUDED_EVENTS = ['message.receipt'];
function subscriptionCoversEvent(events, event) {
    return events.includes(event) || (events.includes('*') && !exports.WILDCARD_EXCLUDED_EVENTS.includes(event));
}
//# sourceMappingURL=wildcard-events.js.map