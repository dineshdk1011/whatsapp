"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatLabelsUnsupportedError = void 0;
const common_1 = require("@nestjs/common");
class ChatLabelsUnsupportedError extends common_1.UnprocessableEntityException {
    constructor(message = 'Chat labels require a WhatsApp Business account.') {
        super(message);
    }
}
exports.ChatLabelsUnsupportedError = ChatLabelsUnsupportedError;
//# sourceMappingURL=chat-labels-unsupported.error.js.map