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
exports.SendTemplateMessageDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const strict_boolean_1 = require("../../../common/utils/strict-boolean");
const send_message_dto_1 = require("./send-message.dto");
const is_mention_wid_validator_1 = require("./is-mention-wid.validator");
class SendTemplateMessageDto {
    chatId;
    templateId;
    templateName;
    vars;
    mentions;
    linkPreview;
}
exports.SendTemplateMessageDto = SendTemplateMessageDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'WhatsApp chat ID (phone@c.us for individual, groupId@g.us for groups)',
        example: '628123456789@c.us',
        maxLength: send_message_dto_1.CHAT_ID_MAX_LENGTH,
    }),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(send_message_dto_1.CHAT_ID_MAX_LENGTH),
    (0, class_validator_1.Matches)(send_message_dto_1.CHAT_JID_PATTERN, { message: send_message_dto_1.CHAT_JID_MESSAGE }),
    __metadata("design:type", String)
], SendTemplateMessageDto.prototype, "chatId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Template ID to render. Provide either templateId or templateName.',
        example: 'b1c2d3e4-f5a6-7890-bcde-f01234567890',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SendTemplateMessageDto.prototype, "templateId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Template name to render. Provide either templateId or templateName.',
        example: 'order-confirmation',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SendTemplateMessageDto.prototype, "templateName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Variables substituted into {{placeholder}} tokens in the template',
        example: { customer: 'Alice', orderId: '1234' },
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], SendTemplateMessageDto.prototype, "vars", void 0);
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
], SendTemplateMessageDto.prototype, "mentions", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Controls the URL preview on the rendered body, with the same engine split as send-text: ' +
            'whatsapp-web.js builds one by default and `false` suppresses it, while on Baileys previews ' +
            'are opt-in and only `true` attaches one.',
        example: false,
    }),
    (0, strict_boolean_1.ToStrictBoolean)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SendTemplateMessageDto.prototype, "linkPreview", void 0);
//# sourceMappingURL=send-template.dto.js.map