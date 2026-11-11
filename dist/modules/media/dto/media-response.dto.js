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
exports.ConvertedMediaResponseDto = exports.ConversionStatusResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class ConversionStatusResponseDto {
    available;
}
exports.ConversionStatusResponseDto = ConversionStatusResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'True only when conversion is switched on AND the ffmpeg binary is runnable. False means a ' +
            'convert call will be refused, so check this before offering conversion in a UI.',
        example: true,
    }),
    __metadata("design:type", Boolean)
], ConversionStatusResponseDto.prototype, "available", void 0);
class ConvertedMediaResponseDto {
    base64;
    mimetype;
    bytes;
}
exports.ConvertedMediaResponseDto = ConvertedMediaResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "The converted bytes, ready to hand straight to a send endpoint's `base64` field.",
        example: 'T2dnUwACAAAAAAAAAAA...',
    }),
    __metadata("design:type", String)
], ConvertedMediaResponseDto.prototype, "base64", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The type the bytes now are — not the type they were.',
        example: 'audio/ogg; codecs=opus',
    }),
    __metadata("design:type", String)
], ConvertedMediaResponseDto.prototype, "mimetype", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Decoded size, so a caller can check a send limit without decoding.', example: 20480 }),
    __metadata("design:type", Number)
], ConvertedMediaResponseDto.prototype, "bytes", void 0);
//# sourceMappingURL=media-response.dto.js.map