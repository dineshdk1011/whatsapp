"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidInviteCodeError = void 0;
const common_1 = require("@nestjs/common");
class InvalidInviteCodeError extends common_1.BadRequestException {
    constructor() {
        super('could not join the group — the invite code may be invalid, expired, or revoked');
    }
}
exports.InvalidInviteCodeError = InvalidInviteCodeError;
//# sourceMappingURL=invalid-invite-code.error.js.map