"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineNotReadyError = void 0;
const common_1 = require("@nestjs/common");
class EngineNotReadyError extends common_1.ConflictException {
    constructor(message = 'Session is not connected. The WhatsApp client is not ready.') {
        super(message);
    }
}
exports.EngineNotReadyError = EngineNotReadyError;
//# sourceMappingURL=engine-not-ready.error.js.map