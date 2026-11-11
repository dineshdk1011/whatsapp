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
exports.ProductQueryDto = exports.SendProductDto = exports.PRODUCT_ID_MAX_LENGTH = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const send_message_dto_1 = require("../../message/dto/send-message.dto");
const send_message_dto_2 = require("../../message/dto/send-message.dto");
const strict_boolean_1 = require("../../../common/utils/strict-boolean");
exports.PRODUCT_ID_MAX_LENGTH = 255;
class SendProductDto {
    chatId;
    productId;
    body;
}
exports.SendProductDto = SendProductDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        maxLength: send_message_dto_2.CHAT_ID_MAX_LENGTH,
        description: 'Chat to send the product card to (@c.us or @g.us).',
        example: '628123456789@c.us',
    }),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(send_message_dto_2.CHAT_ID_MAX_LENGTH),
    (0, class_validator_1.Matches)(send_message_dto_2.CHAT_JID_PATTERN, { message: send_message_dto_2.CHAT_JID_MESSAGE }),
    __metadata("design:type", String)
], SendProductDto.prototype, "chatId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Catalog product id to send.', example: 'product-42', maxLength: exports.PRODUCT_ID_MAX_LENGTH }),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(exports.PRODUCT_ID_MAX_LENGTH),
    __metadata("design:type", String)
], SendProductDto.prototype, "productId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Optional body text accompanying the product card.',
        example: 'Back in stock!',
        maxLength: send_message_dto_1.MESSAGE_TEXT_MAX_LENGTH,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(send_message_dto_1.MESSAGE_TEXT_MAX_LENGTH),
    __metadata("design:type", String)
], SendProductDto.prototype, "body", void 0);
class ProductQueryDto {
    page = 1;
    limit = 20;
}
exports.ProductQueryDto = ProductQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Result page (1-based).', example: 1, type: 'integer', minimum: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ProductQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Page size.', example: 20, type: 'integer', minimum: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ProductQueryDto.prototype, "limit", void 0);
//# sourceMappingURL=send-product.dto.js.map