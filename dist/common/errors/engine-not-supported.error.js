"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineNotSupportedError = void 0;
const common_1 = require("@nestjs/common");
class EngineNotSupportedError extends common_1.NotImplementedException {
    constructor(method) {
        super(`Operation not supported by the active engine: ${method}`);
    }
}
exports.EngineNotSupportedError = EngineNotSupportedError;
//# sourceMappingURL=engine-not-supported.error.js.map