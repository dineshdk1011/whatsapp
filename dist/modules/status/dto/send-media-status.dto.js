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
exports.SendVoiceStatusDto = exports.SendVideoStatusDto = exports.SendImageStatusDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const media_url_1 = require("../../../common/media/media-url");
const media_cap_util_1 = require("../../message/media-cap.util");
const strict_boolean_1 = require("../../../common/utils/strict-boolean");
class StatusMediaInput {
    url;
    base64;
    mimetype;
}
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Public http(s) URL of the media (server-fetched, SSRF-guarded).',
        example: 'https://example.com/banner.jpg',
    }),
    (0, class_validator_1.ValidateIf)((media) => media.base64 === undefined || media.url !== undefined),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, media_url_1.IsMediaUrl)({ ignoreWhen: media => !!(0, media_cap_util_1.stripBase64DataUri)(media.base64) }),
    __metadata("design:type", String)
], StatusMediaInput.prototype, "url", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Base64-encoded media.',
        example: '/9j/4AAQSkZJRg...',
    }),
    (0, class_validator_1.ValidateIf)((media) => media.url === undefined || media.base64 !== undefined),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], StatusMediaInput.prototype, "base64", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: "MIME type. Optional: when omitted, the endpoint's default applies (image/jpeg, video/mp4, or " +
            'audio/ogg; codecs=opus for a voice note).',
        example: 'image/jpeg',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StatusMediaInput.prototype, "mimetype", void 0);
class SendImageStatusDto {
    image;
    caption;
    recipients;
}
exports.SendImageStatusDto = SendImageStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Image source (URL or base64).', type: StatusMediaInput }),
    (0, class_validator_1.IsDefined)(),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => StatusMediaInput),
    __metadata("design:type", StatusMediaInput)
], SendImageStatusDto.prototype, "image", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Optional caption.', example: 'New drop!', maxLength: 1024 }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1024),
    __metadata("design:type", String)
], SendImageStatusDto.prototype, "caption", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Recipient JIDs (0–256), @c.us or @lid. Required on the Baileys engine (it posts to exactly this ' +
            "allow-list); ignored by whatsapp-web.js, which broadcasts to the account's status-privacy " +
            'audience — omit it there.',
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
], SendImageStatusDto.prototype, "recipients", void 0);
class SendVideoStatusDto {
    video;
    caption;
    recipients;
}
exports.SendVideoStatusDto = SendVideoStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Video source (URL or base64).', type: StatusMediaInput }),
    (0, class_validator_1.IsDefined)(),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => StatusMediaInput),
    __metadata("design:type", StatusMediaInput)
], SendVideoStatusDto.prototype, "video", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Optional caption.', example: 'Demo', maxLength: 1024 }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1024),
    __metadata("design:type", String)
], SendVideoStatusDto.prototype, "caption", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Recipient JIDs (0–256), @c.us or @lid. Required on the Baileys engine (it posts to exactly this ' +
            "allow-list); ignored by whatsapp-web.js, which broadcasts to the account's status-privacy " +
            'audience — omit it there.',
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
], SendVideoStatusDto.prototype, "recipients", void 0);
class SendVoiceStatusDto {
    audio;
    backgroundColor;
    recipients;
}
exports.SendVoiceStatusDto = SendVoiceStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Audio source (URL or base64). WhatsApp plays a status voice note only as Ogg/Opus, and neither ' +
            'engine transcodes — use the media conversion endpoint to produce it. The mimetype defaults to ' +
            "'audio/ogg; codecs=opus'.",
        type: StatusMediaInput,
    }),
    (0, class_validator_1.IsDefined)(),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => StatusMediaInput),
    __metadata("design:type", StatusMediaInput)
], SendVoiceStatusDto.prototype, "audio", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Background colour as `#RRGGBB`, which WhatsApp renders behind the voice-note bubble. ' +
            'Baileys only — whatsapp-web.js exposes no styling for a status and ignores it.',
        example: '#25D366',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^#[0-9A-Fa-f]{6}$/, { message: 'backgroundColor must be a hex color (e.g., #25D366)' }),
    __metadata("design:type", String)
], SendVoiceStatusDto.prototype, "backgroundColor", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Recipient JIDs (0–256), @c.us or @lid. Required on the Baileys engine (it posts to exactly this ' +
            "allow-list); ignored by whatsapp-web.js, which broadcasts to the account's status-privacy " +
            'audience — omit it there.',
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
], SendVoiceStatusDto.prototype, "recipients", void 0);
//# sourceMappingURL=send-media-status.dto.js.map