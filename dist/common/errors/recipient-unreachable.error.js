"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecipientUnreachableError = void 0;
const common_1 = require("@nestjs/common");
class RecipientUnreachableError extends common_1.BadRequestException {
    constructor(chatId) {
        super(`WhatsApp could not resolve the recipient ${chatId}. Either the number is not on WhatsApp, or ` +
            'this session has no existing chat with it — message it once from the phone, then retry.');
    }
}
exports.RecipientUnreachableError = RecipientUnreachableError;
//# sourceMappingURL=recipient-unreachable.error.js.map