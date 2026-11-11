"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HOOK_RESULT_ACCEPT = void 0;
exports.isMessagePayload = isMessagePayload;
exports.isWebhookBeforeResult = isWebhookBeforeResult;
const isPlainObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
function isMessagePayload(data) {
    const candidate = data;
    return isPlainObject(candidate) && typeof candidate.id === 'string' && typeof candidate.chatId === 'string';
}
function isWebhookBeforeResult(data) {
    return isPlainObject(data) && isPlainObject(data.payload);
}
exports.HOOK_RESULT_ACCEPT = {
    'message:received': isMessagePayload,
    'message:sent': isMessagePayload,
    'webhook:before': isWebhookBeforeResult,
};
//# sourceMappingURL=hook-results.js.map