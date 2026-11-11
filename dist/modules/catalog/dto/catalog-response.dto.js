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
exports.ProductMessageResponseDto = exports.PaginatedProductsDto = exports.ProductPaginationDto = exports.ProductDto = exports.CatalogDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class CatalogDto {
    id;
    name;
    description;
    productCount;
    url;
}
exports.CatalogDto = CatalogDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Catalog id. Synthesized from the first collection — the only named grouping the engine exposes.',
        example: '1234567890123456',
    }),
    __metadata("design:type", String)
], CatalogDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Collection name.', example: 'Default' }),
    __metadata("design:type", String)
], CatalogDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Collection description, when the engine reports one.' }),
    __metadata("design:type", String)
], CatalogDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'How many products the first collection holds, counting at most the first 51 on Baileys.',
        example: 12,
    }),
    __metadata("design:type", Number)
], CatalogDto.prototype, "productCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Public catalog link for the account.', example: 'https://wa.me/c/628123456789' }),
    __metadata("design:type", String)
], CatalogDto.prototype, "url", void 0);
class ProductDto {
    id;
    name;
    description;
    price;
    currency;
    priceFormatted;
    imageUrl;
    url;
    isAvailable;
    retailerId;
}
exports.ProductDto = ProductDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Product id in the engine's native format.", example: '7891234567890' }),
    __metadata("design:type", String)
], ProductDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Product name.', example: 'Kopi Gayo 200g' }),
    __metadata("design:type", String)
], ProductDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Product description, when set.' }),
    __metadata("design:type", String)
], ProductDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Price in the currency’s minor-unit-free numeric form. Absent when the product has no price.',
        example: 85000,
    }),
    __metadata("design:type", Number)
], ProductDto.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'ISO currency code. Absent when the product carries no currency.',
        example: 'IDR',
    }),
    __metadata("design:type", String)
], ProductDto.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Price rendered for display. Synthesized by the gateway from price + currency, so an ' +
            'unrecognised currency code falls back to a plain "CODE amount" pair, and a product with no ' +
            'currency shows the bare amount. Present only when price is.',
        example: 'IDR 85,000',
    }),
    __metadata("design:type", String)
], ProductDto.prototype, "priceFormatted", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'First product image URL. Absent when the product carries no image.',
        example: 'https://pps.whatsapp.net/v/t61.24694-24/12345_678_910_n.jpg',
    }),
    __metadata("design:type", String)
], ProductDto.prototype, "imageUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Product link, empty when the engine reports none.', example: 'https://wa.me/p/123/628' }),
    __metadata("design:type", String)
], ProductDto.prototype, "url", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether the engine reports the product as in stock.', example: true }),
    __metadata("design:type", Boolean)
], ProductDto.prototype, "isAvailable", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "The merchant's own SKU, when set.", example: 'SKU-001' }),
    __metadata("design:type", String)
], ProductDto.prototype, "retailerId", void 0);
class ProductPaginationDto {
    page;
    limit;
    total;
    totalPages;
}
exports.ProductPaginationDto = ProductPaginationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Page that was returned (1-based).', example: 1 }),
    __metadata("design:type", Number)
], ProductPaginationDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Page size that was applied.', example: 20 }),
    __metadata("design:type", Number)
], ProductPaginationDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total products in the catalog, not on this page.', example: 12 }),
    __metadata("design:type", Number)
], ProductPaginationDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total pages at this page size.', example: 1 }),
    __metadata("design:type", Number)
], ProductPaginationDto.prototype, "totalPages", void 0);
class PaginatedProductsDto {
    products;
    pagination;
}
exports.PaginatedProductsDto = PaginatedProductsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [ProductDto], description: 'Products on the requested page.' }),
    __metadata("design:type", Array)
], PaginatedProductsDto.prototype, "products", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: ProductPaginationDto }),
    __metadata("design:type", ProductPaginationDto)
], PaginatedProductsDto.prototype, "pagination", void 0);
class ProductMessageResponseDto {
    id;
    timestamp;
}
exports.ProductMessageResponseDto = ProductMessageResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The message id, assigned when the gateway accepts the message for sending. Note the field ' +
            'name: the send routes served by MessageService answer `messageId` for the same value. A 2xx ' +
            'here means the message was handed to the WhatsApp client, not that it was delivered.\n\n' +
            'This route is Baileys-only, so the id is the bare key id Baileys assigns — not the ' +
            '`true_<jid>_<id>` serialized form the whatsapp-web.js send routes report.',
        example: '3EB0C767D26B8A3F6E',
    }),
    __metadata("design:type", String)
], ProductMessageResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Unix SECONDS the engine stamped on the outgoing message.', example: 1786000000 }),
    __metadata("design:type", Number)
], ProductMessageResponseDto.prototype, "timestamp", void 0);
//# sourceMappingURL=catalog-response.dto.js.map