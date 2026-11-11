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
exports.SetProfilePictureDto = exports.SetProfileStatusDto = exports.SetProfileNameDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const media_url_1 = require("../../../common/media/media-url");
const media_cap_util_1 = require("../../message/media-cap.util");
const strict_boolean_1 = require("../../../common/utils/strict-boolean");
class SetProfileNameDto {
    name;
}
exports.SetProfileNameDto = SetProfileNameDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'New display name (WhatsApp limit: 25 characters)', maxLength: 25 }),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(25),
    __metadata("design:type", String)
], SetProfileNameDto.prototype, "name", void 0);
class SetProfileStatusDto {
    status;
}
exports.SetProfileStatusDto = SetProfileStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'New about/status text (may be empty to clear it; WhatsApp limit: 139 characters)',
        maxLength: 139,
    }),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(139),
    __metadata("design:type", String)
], SetProfileStatusDto.prototype, "status", void 0);
class SetProfilePictureDto {
    url;
    base64;
    mimetype;
}
exports.SetProfilePictureDto = SetProfilePictureDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Image URL (http/https)',
        example: 'https://example.com/avatar.jpg',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, media_url_1.IsMediaUrl)({ ignoreWhen: o => !!(0, media_cap_util_1.stripBase64DataUri)(o.base64) }),
    __metadata("design:type", String)
], SetProfilePictureDto.prototype, "url", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Base64 encoded image data',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SetProfilePictureDto.prototype, "base64", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Image MIME type (required when using base64)',
        example: 'image/jpeg',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^image\//),
    __metadata("design:type", String)
], SetProfilePictureDto.prototype, "mimetype", void 0);
//# sourceMappingURL=profile.dto.js.map