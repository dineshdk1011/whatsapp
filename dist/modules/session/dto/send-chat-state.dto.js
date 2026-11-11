"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendChatStateDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const send_message_dto_1 = require("../../message/dto/send-message.dto");
const strict_boolean_1 = require("../../../common/utils/strict-boolean");
class SendChatStateDto {
    chatId;
    state;
}
exports.SendChatStateDto = SendChatStateDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        maxLength: send_message_dto_1.CHAT_ID_MAX_LENGTH,
        description: 'Chat ID in the neutral form the gateway returns, on either engine (e.g. 1234567890@c.us)',
        example: '1234567890@c.us',
    }),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(send_message_dto_1.CHAT_ID_MAX_LENGTH),
    (0, class_validator_1.Matches)(send_message_dto_1.CHAT_JID_PATTERN, { message: send_message_dto_1.CHAT_JID_MESSAGE }),
    __metadata("design:type", String)
], SendChatStateDto.prototype, "chatId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "Presence to send: 'typing' or 'recording' shows the indicator; 'paused' clears it",
        enum: ['typing', 'recording', 'paused'],
        example: 'typing',
    }),
    (0, class_validator_1.IsIn)(['typing', 'recording', 'paused']),
    __metadata("design:type", String)
], SendChatStateDto.prototype, "state", void 0);
//# sourceMappingURL=send-chat-state.dto.js.map