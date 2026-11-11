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
exports.TransferChannelOwnershipDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const strict_boolean_1 = require("../../../common/utils/strict-boolean");
class TransferChannelOwnershipDto {
    newOwnerId;
}
exports.TransferChannelOwnershipDto = TransferChannelOwnershipDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'WhatsApp ID of the account that becomes the new owner — a phone number, `<phone>@c.us` or ' +
            '`<lid>@lid`; a bare number is qualified for you. Anything that does not name an individual ' +
            'is rejected with 400 rather than handed to WhatsApp. This is irreversible: once the ' +
            'transfer lands, this session can no longer take the channel back.',
        example: '628123456789@c.us',
    }),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], TransferChannelOwnershipDto.prototype, "newOwnerId", void 0);
//# sourceMappingURL=transfer-channel-ownership.dto.js.map