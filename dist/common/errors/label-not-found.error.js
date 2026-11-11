"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LabelNotFoundError = void 0;
const common_1 = require("@nestjs/common");
class LabelNotFoundError extends common_1.NotFoundException {
    constructor(labelId) {
        super(`Label ${labelId} not found`);
    }
}
exports.LabelNotFoundError = LabelNotFoundError;
//# sourceMappingURL=label-not-found.error.js.map