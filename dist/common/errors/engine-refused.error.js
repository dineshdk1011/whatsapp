"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineRefusedError = void 0;
const common_1 = require("@nestjs/common");
class EngineRefusedError extends common_1.ForbiddenException {
    constructor(detail) {
        super(detail);
    }
}
exports.EngineRefusedError = EngineRefusedError;
//# sourceMappingURL=engine-refused.error.js.map