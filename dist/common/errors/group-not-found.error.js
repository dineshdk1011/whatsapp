"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupNotFoundError = void 0;
const common_1 = require("@nestjs/common");
class GroupNotFoundError extends common_1.NotFoundException {
    constructor(groupId) {
        super(`Group ${groupId} not found`);
    }
}
exports.GroupNotFoundError = GroupNotFoundError;
//# sourceMappingURL=group-not-found.error.js.map