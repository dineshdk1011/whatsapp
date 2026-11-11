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
exports.ChatPresenceResponseDto = exports.ParticipantPresenceDto = exports.SubscribePresenceDto = exports.SetOwnPresenceDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const strict_boolean_1 = require("../../../common/utils/strict-boolean");
const send_message_dto_1 = require("../../message/dto/send-message.dto");
class SetOwnPresenceDto {
    available;
}
exports.SetOwnPresenceDto = SetOwnPresenceDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "true = appear online; false = appear offline (hands notifications back to the phone — an always-online linked device suppresses the phone's own alerts)",
        example: false,
    }),
    (0, strict_boolean_1.ToStrictBoolean)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SetOwnPresenceDto.prototype, "available", void 0);
class SubscribePresenceDto {
    chatId;
}
exports.SubscribePresenceDto = SubscribePresenceDto;
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
], SubscribePresenceDto.prototype, "chatId", void 0);
class ParticipantPresenceDto {
    id;
    state;
    lastSeen;
}
exports.ParticipantPresenceDto = ParticipantPresenceDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Participant id. In a 1:1 chat this is the chat itself.', example: '1234567890@c.us' }),
    __metadata("design:type", String)
], ParticipantPresenceDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: ['available', 'unavailable', 'composing', 'recording', 'paused'],
        description: '`composing` and `recording` mean actively typing or recording in this chat; `paused` means ' +
            'they stopped without sending. `available`/`unavailable` describe reachability.',
        example: 'composing',
    }),
    __metadata("design:type", String)
], ParticipantPresenceDto.prototype, "state", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: Number,
        description: "Unix SECONDS the contact was last seen. Absent whenever the contact's privacy settings hide " +
            'last-seen — the common case, and not an error.',
        example: 1786000000,
    }),
    __metadata("design:type", Number)
], ParticipantPresenceDto.prototype, "lastSeen", void 0);
class ChatPresenceResponseDto {
    chatId;
    participants;
    groupOnlineCount;
    observedAt;
}
exports.ChatPresenceResponseDto = ChatPresenceResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '1234567890@c.us' }),
    __metadata("design:type", String)
], ChatPresenceResponseDto.prototype, "chatId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [ParticipantPresenceDto] }),
    __metadata("design:type", Array)
], ChatPresenceResponseDto.prototype, "participants", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: Number, description: 'Online member count, groups only.', example: 3 }),
    __metadata("design:type", Number)
], ChatPresenceResponseDto.prototype, "groupOnlineCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        format: 'date-time',
        description: 'When this gateway received the report — NOT a WhatsApp timestamp. Presence is short-lived, so ' +
            'an old `observedAt` means the state is stale rather than steady.',
        example: '2026-08-03T12:00:00Z',
    }),
    __metadata("design:type", Date)
], ChatPresenceResponseDto.prototype, "observedAt", void 0);
//# sourceMappingURL=presence.dto.js.map