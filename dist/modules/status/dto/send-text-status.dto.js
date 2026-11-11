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
exports.SendTextStatusDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const strict_boolean_1 = require("../../../common/utils/strict-boolean");
class SendTextStatusDto {
    text;
    backgroundColor;
    font;
    recipients;
}
exports.SendTextStatusDto = SendTextStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Status text body. Must contain a non-whitespace character.',
        example: 'Out for delivery 📦',
        minLength: 1,
        maxLength: 4096,
    }),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/\S/, { message: 'text must not be blank' }),
    (0, class_validator_1.MaxLength)(4096),
    __metadata("design:type", String)
], SendTextStatusDto.prototype, "text", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Background color (hex).', example: '#25D366' }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^#[0-9A-Fa-f]{6}$/, { message: 'backgroundColor must be a hex color (e.g., #25D366)' }),
    __metadata("design:type", String)
], SendTextStatusDto.prototype, "backgroundColor", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Font family index from the WhatsApp status font enum: 0 (default), 1, 2, 6 (bold), 7, 8, 9, ' +
            'or 10. whatsapp-web.js honors only 0–7 and clamps anything above to the default.',
        example: 0,
        enum: [0, 1, 2, 6, 7, 8, 9, 10],
    }),
    (0, strict_boolean_1.ToStrictNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsIn)([0, 1, 2, 6, 7, 8, 9, 10]),
    __metadata("design:type", Number)
], SendTextStatusDto.prototype, "font", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Recipient JIDs (0–256). WhatsApp Status is not posted to a group — use @c.us or @lid individuals. ' +
            'Required on the Baileys engine (it posts to exactly this allow-list); ignored by whatsapp-web.js, ' +
            "which broadcasts to the account's status-privacy audience — omit it there.",
        type: String,
        isArray: true,
        example: ['628123456789@c.us'],
        maxItems: 256,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictArray)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(256),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.Matches)(/^\d+@(c\.us|lid)$/, { each: true, message: 'Invalid recipient JID' }),
    __metadata("design:type", Array)
], SendTextStatusDto.prototype, "recipients", void 0);
//# sourceMappingURL=send-text-status.dto.js.map