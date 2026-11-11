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
exports.PairingCodeResponseDto = exports.RequestPairingCodeDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const strict_boolean_1 = require("../../../common/utils/strict-boolean");
class RequestPairingCodeDto {
    phoneNumber;
}
exports.RequestPairingCodeDto = RequestPairingCodeDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Phone number to link, digits only in international format (country code + number).',
        example: '628123456789',
        pattern: '^[0-9]{6,15}$',
    }),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Matches)(/^[0-9]{6,15}$/, {
        message: 'phoneNumber must be digits only in international format (country code + number), e.g. 628123456789',
    }),
    __metadata("design:type", String)
], RequestPairingCodeDto.prototype, "phoneNumber", void 0);
class PairingCodeResponseDto {
    pairingCode;
    status;
}
exports.PairingCodeResponseDto = PairingCodeResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The 8-character pairing code to enter in WhatsApp.', example: 'ABCD1234' }),
    __metadata("design:type", String)
], PairingCodeResponseDto.prototype, "pairingCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Current session status.', example: 'qr_ready' }),
    __metadata("design:type", String)
], PairingCodeResponseDto.prototype, "status", void 0);
//# sourceMappingURL=request-pairing-code.dto.js.map