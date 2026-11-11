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
exports.TemplateResponseDto = exports.UpdateTemplateDto = exports.CreateTemplateDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const max_code_points_1 = require("../../../common/validation/max-code-points");
const no_nul_character_1 = require("../../../common/validation/no-nul-character");
const strict_boolean_1 = require("../../../common/utils/strict-boolean");
const NAME_MAX_LENGTH = 100;
const BODY_MAX_LENGTH = 4096;
const HEADER_FOOTER_MAX_LENGTH = 1024;
class CreateTemplateDto {
    name;
    body;
    header;
    footer;
}
exports.CreateTemplateDto = CreateTemplateDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Unique template name within the session',
        example: 'order-confirmation',
        maxLength: NAME_MAX_LENGTH,
    }),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, max_code_points_1.MaxCodePoints)(NAME_MAX_LENGTH),
    (0, no_nul_character_1.NoNulCharacter)(),
    __metadata("design:type", String)
], CreateTemplateDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Template body with {{variable}} placeholders',
        example: 'Hi {{customer}}, your order {{orderId}} has shipped.',
        maxLength: BODY_MAX_LENGTH,
    }),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(BODY_MAX_LENGTH),
    (0, no_nul_character_1.NoNulCharacter)(),
    __metadata("design:type", String)
], CreateTemplateDto.prototype, "body", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Optional header text, prepended to the rendered body',
        example: 'OpenWA Store',
        maxLength: HEADER_FOOTER_MAX_LENGTH,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(HEADER_FOOTER_MAX_LENGTH),
    (0, no_nul_character_1.NoNulCharacter)(),
    __metadata("design:type", String)
], CreateTemplateDto.prototype, "header", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Optional footer text, appended to the rendered body',
        example: 'Reply STOP to unsubscribe.',
        maxLength: HEADER_FOOTER_MAX_LENGTH,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(HEADER_FOOTER_MAX_LENGTH),
    (0, no_nul_character_1.NoNulCharacter)(),
    __metadata("design:type", String)
], CreateTemplateDto.prototype, "footer", void 0);
class UpdateTemplateDto {
    name;
    body;
    header;
    footer;
}
exports.UpdateTemplateDto = UpdateTemplateDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Template name', maxLength: NAME_MAX_LENGTH }),
    (0, class_validator_1.ValidateIf)((o) => o.name !== undefined),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, max_code_points_1.MaxCodePoints)(NAME_MAX_LENGTH),
    (0, no_nul_character_1.NoNulCharacter)(),
    __metadata("design:type", String)
], UpdateTemplateDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Template body with {{variable}} placeholders', maxLength: BODY_MAX_LENGTH }),
    (0, class_validator_1.ValidateIf)((o) => o.body !== undefined),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(BODY_MAX_LENGTH),
    (0, no_nul_character_1.NoNulCharacter)(),
    __metadata("design:type", String)
], UpdateTemplateDto.prototype, "body", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Optional header text', maxLength: HEADER_FOOTER_MAX_LENGTH }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(HEADER_FOOTER_MAX_LENGTH),
    (0, no_nul_character_1.NoNulCharacter)(),
    __metadata("design:type", String)
], UpdateTemplateDto.prototype, "header", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Optional footer text', maxLength: HEADER_FOOTER_MAX_LENGTH }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(HEADER_FOOTER_MAX_LENGTH),
    (0, no_nul_character_1.NoNulCharacter)(),
    __metadata("design:type", String)
], UpdateTemplateDto.prototype, "footer", void 0);
class TemplateResponseDto {
    id;
    sessionId;
    name;
    body;
    header;
    footer;
    createdAt;
    updatedAt;
}
exports.TemplateResponseDto = TemplateResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TemplateResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TemplateResponseDto.prototype, "sessionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TemplateResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TemplateResponseDto.prototype, "body", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: String, nullable: true }),
    __metadata("design:type", Object)
], TemplateResponseDto.prototype, "header", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: String, nullable: true }),
    __metadata("design:type", Object)
], TemplateResponseDto.prototype, "footer", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], TemplateResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], TemplateResponseDto.prototype, "updatedAt", void 0);
//# sourceMappingURL=template.dto.js.map