"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineNotSentError = void 0;
exports.markNothingSent = markNothingSent;
exports.provesNothingSent = provesNothingSent;
const engine_transport_error_1 = require("./engine-transport.error");
class EngineNotSentError extends engine_transport_error_1.EngineTransportError {
}
exports.EngineNotSentError = EngineNotSentError;
const raisedBeforeSend = new WeakSet();
function markNothingSent(error) {
    if (error !== null && typeof error === 'object')
        raisedBeforeSend.add(error);
    return error;
}
function provesNothingSent(error) {
    return (error instanceof EngineNotSentError || (error !== null && typeof error === 'object' && raisedBeforeSend.has(error)));
}
//# sourceMappingURL=engine-not-sent.error.js.map