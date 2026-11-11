"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatJidSchema = exports.chatIdSchema = void 0;
const zod_1 = require("zod");
const send_message_dto_1 = require("../../modules/message/dto/send-message.dto");
exports.chatIdSchema = zod_1.z.string().min(1).max(send_message_dto_1.CHAT_ID_MAX_LENGTH);
exports.chatJidSchema = exports.chatIdSchema.regex(send_message_dto_1.CHAT_JID_PATTERN, send_message_dto_1.CHAT_JID_MESSAGE);
//# sourceMappingURL=chat-id-schema.js.map