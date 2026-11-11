"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markEngineSendFailure = markEngineSendFailure;
exports.isEngineSendFailure = isEngineSendFailure;
const attemptedSendFailures = new WeakSet();
function markEngineSendFailure(error) {
    if (error !== null && typeof error === 'object')
        attemptedSendFailures.add(error);
    return error;
}
function isEngineSendFailure(error) {
    return error !== null && typeof error === 'object' && attemptedSendFailures.has(error);
}
//# sourceMappingURL=engine-send-failure.js.map