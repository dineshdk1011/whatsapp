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
exports.AutomationRuleResponseDto = exports.UpdateAutomationRuleDto = exports.CreateAutomationRuleDto = exports.AUTOMATION_COOLDOWN_MAX_SECONDS = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const strict_boolean_1 = require("../../../common/utils/strict-boolean");
const max_code_points_1 = require("../../../common/validation/max-code-points");
const no_nul_character_1 = require("../../../common/validation/no-nul-character");
const send_message_dto_1 = require("../../message/dto/send-message.dto");
const filter_validation_1 = require("../../webhook/filters/filter-validation");
exports.AUTOMATION_COOLDOWN_MAX_SECONDS = 86_400;
const CONDITIONS_DESCRIPTION = 'Match conditions in the webhook filter format (message family: sender, recipient, chatId, body, ' +
    'type, isGroup, kind, fromMe, hasMedia, mentions). All conditions must match (AND). Omitted or ' +
    'empty means the rule matches every inbound message except channel, broadcast-list and status ' +
    'messages, which a rule answers only when it has a `kind` condition that matches them. On Baileys ' +
    "a message received through a contact's broadcast list is filed under the sender's chat (`kind` " +
    'individual), so it matches.';
const COOLDOWN_DESCRIPTION = 'Quiet period per chat, in seconds: after the rule replies in a chat it stays silent there for ' +
    'this long (default 60, 0 disables). This is the guard against two auto-repliers answering each ' +
    'other forever, so disable it knowingly.';
class CreateAutomationRuleDto {
    name;
    replyText;
    conditions;
    cooldownSeconds;
    enabled;
}
exports.CreateAutomationRuleDto = CreateAutomationRuleDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Display name for the rule', example: 'Greet new enquiries', maxLength: 100 }),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, max_code_points_1.MaxCodePoints)(100),
    (0, no_nul_character_1.NoNulCharacter)(),
    __metadata("design:type", String)
], CreateAutomationRuleDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Text sent back into the chat when the rule matches',
        example: 'Thanks for reaching out — we reply within the hour.',
        maxLength: send_message_dto_1.MESSAGE_TEXT_MAX_LENGTH,
    }),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(send_message_dto_1.MESSAGE_TEXT_MAX_LENGTH),
    (0, no_nul_character_1.NoNulCharacter)(),
    __metadata("design:type", String)
], CreateAutomationRuleDto.prototype, "replyText", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: CONDITIONS_DESCRIPTION }),
    (0, class_validator_1.IsOptional)(),
    (0, filter_validation_1.IsValidWebhookFilters)(),
    __metadata("design:type", Object)
], CreateAutomationRuleDto.prototype, "conditions", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: COOLDOWN_DESCRIPTION,
        default: 60,
        minimum: 0,
        maximum: exports.AUTOMATION_COOLDOWN_MAX_SECONDS,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictNumber)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(exports.AUTOMATION_COOLDOWN_MAX_SECONDS),
    __metadata("design:type", Number)
], CreateAutomationRuleDto.prototype, "cooldownSeconds", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Whether the rule is active', default: true }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictBoolean)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateAutomationRuleDto.prototype, "enabled", void 0);
class UpdateAutomationRuleDto {
    name;
    replyText;
    conditions;
    cooldownSeconds;
    enabled;
}
exports.UpdateAutomationRuleDto = UpdateAutomationRuleDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Display name for the rule', maxLength: 100 }),
    (0, class_validator_1.ValidateIf)((o) => o.name !== undefined),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, max_code_points_1.MaxCodePoints)(100),
    (0, no_nul_character_1.NoNulCharacter)(),
    __metadata("design:type", String)
], UpdateAutomationRuleDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Text sent back into the chat when the rule matches',
        maxLength: send_message_dto_1.MESSAGE_TEXT_MAX_LENGTH,
    }),
    (0, class_validator_1.ValidateIf)((o) => o.replyText !== undefined),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(send_message_dto_1.MESSAGE_TEXT_MAX_LENGTH),
    (0, no_nul_character_1.NoNulCharacter)(),
    __metadata("design:type", String)
], UpdateAutomationRuleDto.prototype, "replyText", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: CONDITIONS_DESCRIPTION }),
    (0, class_validator_1.IsOptional)(),
    (0, filter_validation_1.IsValidWebhookFilters)(),
    __metadata("design:type", Object)
], UpdateAutomationRuleDto.prototype, "conditions", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: COOLDOWN_DESCRIPTION, minimum: 0, maximum: exports.AUTOMATION_COOLDOWN_MAX_SECONDS }),
    (0, class_validator_1.ValidateIf)((o) => o.cooldownSeconds !== undefined),
    (0, strict_boolean_1.ToStrictNumber)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(exports.AUTOMATION_COOLDOWN_MAX_SECONDS),
    __metadata("design:type", Number)
], UpdateAutomationRuleDto.prototype, "cooldownSeconds", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Whether the rule is active' }),
    (0, class_validator_1.ValidateIf)((o) => o.enabled !== undefined),
    (0, strict_boolean_1.ToStrictBoolean)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateAutomationRuleDto.prototype, "enabled", void 0);
class AutomationRuleResponseDto {
    id;
    sessionId;
    name;
    enabled;
    conditions;
    replyText;
    cooldownSeconds;
    createdAt;
    updatedAt;
    static fromEntity(rule) {
        return (0, class_transformer_1.plainToInstance)(AutomationRuleResponseDto, rule, { excludeExtraneousValues: true });
    }
}
exports.AutomationRuleResponseDto = AutomationRuleResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], AutomationRuleResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], AutomationRuleResponseDto.prototype, "sessionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], AutomationRuleResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Boolean)
], AutomationRuleResponseDto.prototype, "enabled", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: CONDITIONS_DESCRIPTION, nullable: true }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], AutomationRuleResponseDto.prototype, "conditions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], AutomationRuleResponseDto.prototype, "replyText", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], AutomationRuleResponseDto.prototype, "cooldownSeconds", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Date)
], AutomationRuleResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Date)
], AutomationRuleResponseDto.prototype, "updatedAt", void 0);
//# sourceMappingURL=automation-rule.dto.js.map