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
exports.ConvertMediaDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const media_url_1 = require("../../../common/media/media-url");
const media_cap_util_1 = require("../../message/media-cap.util");
const strict_boolean_1 = require("../../../common/utils/strict-boolean");
class ConvertMediaDto {
    url;
    base64;
}
exports.ConvertMediaDto = ConvertMediaDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Public http(s) URL of the media to convert (server-fetched, SSRF-guarded).',
        example: 'https://example.com/note.m4a',
    }),
    (0, class_validator_1.ValidateIf)((dto) => dto.base64 === undefined || dto.url !== undefined),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, media_url_1.IsMediaUrl)({ ignoreWhen: o => !!(0, media_cap_util_1.stripBase64DataUri)(o.base64) }),
    __metadata("design:type", String)
], ConvertMediaDto.prototype, "url", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Base64-encoded media to convert. Takes precedence when both are supplied.',
        example: 'SUQzBAAAAAAA...',
    }),
    (0, class_validator_1.ValidateIf)((dto) => dto.url === undefined || dto.base64 !== undefined),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ConvertMediaDto.prototype, "base64", void 0);
//# sourceMappingURL=convert-media.dto.js.map