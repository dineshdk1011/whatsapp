"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageNotFoundError = void 0;
const common_1 = require("@nestjs/common");
class MessageNotFoundError extends common_1.NotFoundException {
    constructor(messageId, chatId) {
        super(chatId ? `Message ${messageId} not found in chat ${chatId}` : `Message ${messageId} not found`);
    }
}
exports.MessageNotFoundError = MessageNotFoundError;
//# sourceMappingURL=message-not-found.error.js.map