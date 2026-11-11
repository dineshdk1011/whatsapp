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
exports.EditMessageDto = exports.UnpinMessageDto = exports.StarMessageDto = exports.ClickButtonDto = exports.VotePollDto = exports.POLL_VOTE_MAX_OPTIONS = exports.PinMessageDto = exports.PIN_DURATIONS_SECONDS = exports.DeleteMessageDto = exports.ReactMessageDto = exports.ForwardMessageDto = exports.ReplyMessageDto = exports.SendPollDto = exports.SendContactDto = exports.SendLocationDto = exports.REACTION_EMOJI_MAX_LENGTH = exports.CONTACT_NUMBER_MAX_LENGTH = exports.CONTACT_NAME_MAX_LENGTH = exports.LOCATION_TEXT_MAX_LENGTH = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const strict_boolean_1 = require("../../../common/utils/strict-boolean");
const send_message_dto_1 = require("./send-message.dto");
const is_mention_wid_validator_1 = require("./is-mention-wid.validator");
exports.LOCATION_TEXT_MAX_LENGTH = 1024;
exports.CONTACT_NAME_MAX_LENGTH = 255;
exports.CONTACT_NUMBER_MAX_LENGTH = 30;
exports.REACTION_EMOJI_MAX_LENGTH = 32;
class SendLocationDto {
    chatId;
    latitude;
    longitude;
    description;
    address;
    quotedMessageId;
}
exports.SendLocationDto = SendLocationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Chat ID (e.g. 628123456789@c.us)', maxLength: send_message_dto_1.CHAT_ID_MAX_LENGTH }),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(send_message_dto_1.CHAT_ID_MAX_LENGTH),
    (0, class_validator_1.Matches)(send_message_dto_1.CHAT_JID_PATTERN, { message: send_message_dto_1.CHAT_JID_MESSAGE }),
    __metadata("design:type", String)
], SendLocationDto.prototype, "chatId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: -6.2088 }),
    (0, strict_boolean_1.ToStrictNumber)(),
    (0, class_validator_1.IsLatitude)(),
    __metadata("design:type", Number)
], SendLocationDto.prototype, "latitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 106.8456 }),
    (0, strict_boolean_1.ToStrictNumber)(),
    (0, class_validator_1.IsLongitude)(),
    __metadata("design:type", Number)
], SendLocationDto.prototype, "longitude", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ maxLength: exports.LOCATION_TEXT_MAX_LENGTH }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(exports.LOCATION_TEXT_MAX_LENGTH),
    __metadata("design:type", String)
], SendLocationDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ maxLength: exports.LOCATION_TEXT_MAX_LENGTH }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(exports.LOCATION_TEXT_MAX_LENGTH),
    __metadata("design:type", String)
], SendLocationDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: send_message_dto_1.QUOTED_MESSAGE_ID_DESCRIPTION, example: send_message_dto_1.QUOTED_MESSAGE_ID_EXAMPLE }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SendLocationDto.prototype, "quotedMessageId", void 0);
class SendContactDto {
    chatId;
    contactName;
    contactNumber;
    quotedMessageId;
}
exports.SendContactDto = SendContactDto;
__decorate([
    (0, swagger_1.ApiProperty)({ maxLength: send_message_dto_1.CHAT_ID_MAX_LENGTH }),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(send_message_dto_1.CHAT_ID_MAX_LENGTH),
    (0, class_validator_1.Matches)(send_message_dto_1.CHAT_JID_PATTERN, { message: send_message_dto_1.CHAT_JID_MESSAGE }),
    __metadata("design:type", String)
], SendContactDto.prototype, "chatId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ maxLength: exports.CONTACT_NAME_MAX_LENGTH }),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(exports.CONTACT_NAME_MAX_LENGTH),
    __metadata("design:type", String)
], SendContactDto.prototype, "contactName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ maxLength: exports.CONTACT_NUMBER_MAX_LENGTH }),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(exports.CONTACT_NUMBER_MAX_LENGTH),
    __metadata("design:type", String)
], SendContactDto.prototype, "contactNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: send_message_dto_1.QUOTED_MESSAGE_ID_DESCRIPTION, example: send_message_dto_1.QUOTED_MESSAGE_ID_EXAMPLE }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SendContactDto.prototype, "quotedMessageId", void 0);
class SendPollDto {
    chatId;
    name;
    options;
    allowMultipleAnswers;
    quotedMessageId;
}
exports.SendPollDto = SendPollDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Chat ID (e.g. 628123456789@c.us or 1203630000@g.us)', maxLength: send_message_dto_1.CHAT_ID_MAX_LENGTH }),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(send_message_dto_1.CHAT_ID_MAX_LENGTH),
    (0, class_validator_1.Matches)(send_message_dto_1.CHAT_JID_PATTERN, { message: send_message_dto_1.CHAT_JID_MESSAGE }),
    __metadata("design:type", String)
], SendPollDto.prototype, "chatId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Poll question / title', maxLength: 255, example: 'Where should we meet?' }),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], SendPollDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Options to vote on (WhatsApp allows between 2 and 12)',
        type: [String],
        minItems: 2,
        maxItems: 12,
        items: { type: 'string', maxLength: 100 },
        example: ['Park', 'Beach', 'Downtown'],
    }),
    (0, strict_boolean_1.ToStrictArray)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(2),
    (0, class_validator_1.ArrayMaxSize)(12),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsNotEmpty)({ each: true }),
    (0, class_validator_1.MaxLength)(100, { each: true }),
    __metadata("design:type", Array)
], SendPollDto.prototype, "options", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Allow voters to pick several options (default single choice)' }),
    (0, strict_boolean_1.ToStrictBoolean)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SendPollDto.prototype, "allowMultipleAnswers", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: send_message_dto_1.QUOTED_MESSAGE_ID_DESCRIPTION, example: send_message_dto_1.QUOTED_MESSAGE_ID_EXAMPLE }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SendPollDto.prototype, "quotedMessageId", void 0);
class ReplyMessageDto {
    chatId;
    quotedMessageId;
    text;
    mentions;
}
exports.ReplyMessageDto = ReplyMessageDto;
__decorate([
    (0, swagger_1.ApiProperty)({ maxLength: send_message_dto_1.CHAT_ID_MAX_LENGTH }),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(send_message_dto_1.CHAT_ID_MAX_LENGTH),
    (0, class_validator_1.Matches)(send_message_dto_1.CHAT_JID_PATTERN, { message: send_message_dto_1.CHAT_JID_MESSAGE }),
    __metadata("design:type", String)
], ReplyMessageDto.prototype, "chatId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ReplyMessageDto.prototype, "quotedMessageId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ maxLength: send_message_dto_1.MESSAGE_TEXT_MAX_LENGTH }),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(send_message_dto_1.MESSAGE_TEXT_MAX_LENGTH),
    __metadata("design:type", String)
], ReplyMessageDto.prototype, "text", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: send_message_dto_1.MENTIONS_DESCRIPTION,
        example: ['628123456789@c.us'],
        type: [String],
        maxItems: send_message_dto_1.MENTIONS_MAX,
        items: { type: 'string', maxLength: send_message_dto_1.MENTION_WID_MAX_LENGTH },
    }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictArray)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(send_message_dto_1.MENTIONS_MAX),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.MaxLength)(send_message_dto_1.MENTION_WID_MAX_LENGTH, { each: true }),
    (0, class_validator_1.Validate)(is_mention_wid_validator_1.IsMentionWidConstraint, { each: true }),
    __metadata("design:type", Array)
], ReplyMessageDto.prototype, "mentions", void 0);
class ForwardMessageDto {
    fromChatId;
    toChatId;
    messageId;
}
exports.ForwardMessageDto = ForwardMessageDto;
__decorate([
    (0, swagger_1.ApiProperty)({ maxLength: send_message_dto_1.CHAT_ID_MAX_LENGTH }),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(send_message_dto_1.CHAT_ID_MAX_LENGTH),
    (0, class_validator_1.Matches)(send_message_dto_1.CHAT_JID_PATTERN, { message: send_message_dto_1.CHAT_JID_MESSAGE }),
    __metadata("design:type", String)
], ForwardMessageDto.prototype, "fromChatId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ maxLength: send_message_dto_1.CHAT_ID_MAX_LENGTH }),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(send_message_dto_1.CHAT_ID_MAX_LENGTH),
    (0, class_validator_1.Matches)(send_message_dto_1.CHAT_JID_PATTERN, { message: send_message_dto_1.CHAT_JID_MESSAGE }),
    __metadata("design:type", String)
], ForwardMessageDto.prototype, "toChatId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ForwardMessageDto.prototype, "messageId", void 0);
class ReactMessageDto {
    chatId;
    messageId;
    emoji;
}
exports.ReactMessageDto = ReactMessageDto;
__decorate([
    (0, swagger_1.ApiProperty)({ maxLength: send_message_dto_1.CHAT_ID_MAX_LENGTH }),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(send_message_dto_1.CHAT_ID_MAX_LENGTH),
    (0, class_validator_1.Matches)(send_message_dto_1.CHAT_JID_PATTERN, { message: send_message_dto_1.CHAT_JID_MESSAGE }),
    __metadata("design:type", String)
], ReactMessageDto.prototype, "chatId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ReactMessageDto.prototype, "messageId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Emoji to react with. Send an empty string to remove the reaction.',
        maxLength: exports.REACTION_EMOJI_MAX_LENGTH,
    }),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(exports.REACTION_EMOJI_MAX_LENGTH),
    __metadata("design:type", String)
], ReactMessageDto.prototype, "emoji", void 0);
class DeleteMessageDto {
    chatId;
    messageId;
    forEveryone;
}
exports.DeleteMessageDto = DeleteMessageDto;
__decorate([
    (0, swagger_1.ApiProperty)({ maxLength: send_message_dto_1.CHAT_ID_MAX_LENGTH }),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(send_message_dto_1.CHAT_ID_MAX_LENGTH),
    (0, class_validator_1.Matches)(send_message_dto_1.CHAT_JID_PATTERN, { message: send_message_dto_1.CHAT_JID_MESSAGE }),
    __metadata("design:type", String)
], DeleteMessageDto.prototype, "chatId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], DeleteMessageDto.prototype, "messageId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Delete for everyone (default true)' }),
    (0, strict_boolean_1.ToStrictBoolean)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], DeleteMessageDto.prototype, "forEveryone", void 0);
exports.PIN_DURATIONS_SECONDS = [86400, 604800, 2592000];
class PinMessageDto {
    chatId;
    messageId;
    durationSeconds;
}
exports.PinMessageDto = PinMessageDto;
__decorate([
    (0, swagger_1.ApiProperty)({ maxLength: send_message_dto_1.CHAT_ID_MAX_LENGTH }),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(send_message_dto_1.CHAT_ID_MAX_LENGTH),
    (0, class_validator_1.Matches)(send_message_dto_1.CHAT_JID_PATTERN, { message: send_message_dto_1.CHAT_JID_MESSAGE }),
    __metadata("design:type", String)
], PinMessageDto.prototype, "chatId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], PinMessageDto.prototype, "messageId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Pin duration in seconds: 86400 (24h), 604800 (7d) or 2592000 (30d). Defaults to 24h.',
        enum: exports.PIN_DURATIONS_SECONDS,
        default: 86400,
    }),
    (0, strict_boolean_1.ToStrictNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(exports.PIN_DURATIONS_SECONDS),
    __metadata("design:type", Number)
], PinMessageDto.prototype, "durationSeconds", void 0);
exports.POLL_VOTE_MAX_OPTIONS = 12;
class VotePollDto {
    chatId;
    pollMessageId;
    options;
}
exports.VotePollDto = VotePollDto;
__decorate([
    (0, swagger_1.ApiProperty)({ maxLength: send_message_dto_1.CHAT_ID_MAX_LENGTH }),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(send_message_dto_1.CHAT_ID_MAX_LENGTH),
    (0, class_validator_1.Matches)(send_message_dto_1.CHAT_JID_PATTERN, { message: send_message_dto_1.CHAT_JID_MESSAGE }),
    __metadata("design:type", String)
], VotePollDto.prototype, "chatId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The poll creation message to vote on.' }),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], VotePollDto.prototype, "pollMessageId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The option TEXTS to select, exactly as they appear on the poll. Replaces the current ' +
            'selection; an empty array clears the vote.',
        type: [String],
        maxItems: exports.POLL_VOTE_MAX_OPTIONS,
    }),
    (0, strict_boolean_1.ToStrictArray)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(exports.POLL_VOTE_MAX_OPTIONS),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], VotePollDto.prototype, "options", void 0);
class ClickButtonDto {
    chatId;
    messageId;
    buttonId;
    text;
}
exports.ClickButtonDto = ClickButtonDto;
__decorate([
    (0, swagger_1.ApiProperty)({ maxLength: send_message_dto_1.CHAT_ID_MAX_LENGTH }),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(send_message_dto_1.CHAT_ID_MAX_LENGTH),
    (0, class_validator_1.Matches)(send_message_dto_1.CHAT_JID_PATTERN, { message: send_message_dto_1.CHAT_JID_MESSAGE }),
    __metadata("design:type", String)
], ClickButtonDto.prototype, "chatId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'WhatsApp id of the business prompt message that offered the buttons.' }),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ClickButtonDto.prototype, "messageId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Stable id of the choice to tap (inbound `buttons[].id`). URL/call CTA buttons cannot be clicked this way.',
        maxLength: send_message_dto_1.BUTTON_ID_MAX_LENGTH,
    }),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(send_message_dto_1.BUTTON_ID_MAX_LENGTH),
    __metadata("design:type", String)
], ClickButtonDto.prototype, "buttonId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Visible label of the choice. When omitted, resolved from the stored prompt; falls back to buttonId.',
        maxLength: send_message_dto_1.MESSAGE_TEXT_MAX_LENGTH,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(send_message_dto_1.MESSAGE_TEXT_MAX_LENGTH),
    __metadata("design:type", String)
], ClickButtonDto.prototype, "text", void 0);
class StarMessageDto {
    chatId;
    messageId;
    star;
}
exports.StarMessageDto = StarMessageDto;
__decorate([
    (0, swagger_1.ApiProperty)({ maxLength: send_message_dto_1.CHAT_ID_MAX_LENGTH }),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(send_message_dto_1.CHAT_ID_MAX_LENGTH),
    (0, class_validator_1.Matches)(send_message_dto_1.CHAT_JID_PATTERN, { message: send_message_dto_1.CHAT_JID_MESSAGE }),
    __metadata("design:type", String)
], StarMessageDto.prototype, "chatId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], StarMessageDto.prototype, "messageId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'true to star, false to remove the star.' }),
    (0, strict_boolean_1.ToStrictBoolean)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], StarMessageDto.prototype, "star", void 0);
class UnpinMessageDto {
    chatId;
    messageId;
}
exports.UnpinMessageDto = UnpinMessageDto;
__decorate([
    (0, swagger_1.ApiProperty)({ maxLength: send_message_dto_1.CHAT_ID_MAX_LENGTH }),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(send_message_dto_1.CHAT_ID_MAX_LENGTH),
    (0, class_validator_1.Matches)(send_message_dto_1.CHAT_JID_PATTERN, { message: send_message_dto_1.CHAT_JID_MESSAGE }),
    __metadata("design:type", String)
], UnpinMessageDto.prototype, "chatId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UnpinMessageDto.prototype, "messageId", void 0);
class EditMessageDto {
    chatId;
    messageId;
    body;
    mentions;
}
exports.EditMessageDto = EditMessageDto;
__decorate([
    (0, swagger_1.ApiProperty)({ maxLength: send_message_dto_1.CHAT_ID_MAX_LENGTH }),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(send_message_dto_1.CHAT_ID_MAX_LENGTH),
    (0, class_validator_1.Matches)(send_message_dto_1.CHAT_JID_PATTERN, { message: send_message_dto_1.CHAT_JID_MESSAGE }),
    __metadata("design:type", String)
], EditMessageDto.prototype, "chatId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], EditMessageDto.prototype, "messageId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'New text body for the message', maxLength: send_message_dto_1.MESSAGE_TEXT_MAX_LENGTH }),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(send_message_dto_1.MESSAGE_TEXT_MAX_LENGTH),
    __metadata("design:type", String)
], EditMessageDto.prototype, "body", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: send_message_dto_1.MENTIONS_DESCRIPTION,
        example: ['628123456789@c.us'],
        type: [String],
        maxItems: send_message_dto_1.MENTIONS_MAX,
        items: { type: 'string', maxLength: send_message_dto_1.MENTION_WID_MAX_LENGTH },
    }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictArray)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(send_message_dto_1.MENTIONS_MAX),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.MaxLength)(send_message_dto_1.MENTION_WID_MAX_LENGTH, { each: true }),
    (0, class_validator_1.Validate)(is_mention_wid_validator_1.IsMentionWidConstraint, { each: true }),
    __metadata("design:type", Array)
], EditMessageDto.prototype, "mentions", void 0);
//# sourceMappingURL=message-actions.dto.js.map