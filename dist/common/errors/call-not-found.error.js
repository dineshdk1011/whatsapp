"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallNotFoundError = void 0;
const common_1 = require("@nestjs/common");
class CallNotFoundError extends common_1.NotFoundException {
    constructor(callId) {
        super(`Call ${callId} not found or no longer ringing`);
    }
}
exports.CallNotFoundError = CallNotFoundError;
//# sourceMappingURL=call-not-found.error.js.map