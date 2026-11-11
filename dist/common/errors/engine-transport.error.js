"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineTransportError = void 0;
const common_1 = require("@nestjs/common");
class EngineTransportError extends common_1.ServiceUnavailableException {
    constructor(detail) {
        super(detail);
    }
}
exports.EngineTransportError = EngineTransportError;
//# sourceMappingURL=engine-transport.error.js.map