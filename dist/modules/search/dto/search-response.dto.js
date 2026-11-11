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
exports.SearchResultsResponseDto = exports.SearchHitDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class SearchHitDto {
    messageId;
    waMessageId;
    sessionId;
    chatId;
    body;
    snippet;
    timestamp;
    type;
    direction;
    from;
    score;
}
exports.SearchHitDto = SearchHitDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Gateway message row id.', example: '7c2e5a91-3b8d-4f6a-a05c-9d1e4b7f2306' }),
    __metadata("design:type", String)
], SearchHitDto.prototype, "messageId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "WhatsApp's own message id.", example: 'true_628123456789@c.us_3EB0123' }),
    __metadata("design:type", String)
], SearchHitDto.prototype, "waMessageId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '0a941dac-a965-45e7-b318-74ae8be134f0' }),
    __metadata("design:type", String)
], SearchHitDto.prototype, "sessionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '628123456789@c.us' }),
    __metadata("design:type", String)
], SearchHitDto.prototype, "chatId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Full message text.', example: 'See you at 10' }),
    __metadata("design:type", String)
], SearchHitDto.prototype, "body", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Excerpt with `<mark>` highlight markers. Render it as TEXT, never as HTML — the markers come ' +
            'from the provider and the body is user-supplied.',
        example: 'See you at <mark>10</mark>',
    }),
    __metadata("design:type", String)
], SearchHitDto.prototype, "snippet", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Unix SECONDS of the message.', example: 1786000000 }),
    __metadata("design:type", Number)
], SearchHitDto.prototype, "timestamp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'text' }),
    __metadata("design:type", String)
], SearchHitDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['incoming', 'outgoing'], example: 'incoming' }),
    __metadata("design:type", String)
], SearchHitDto.prototype, "direction", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Sender id.', example: '628123456789@c.us' }),
    __metadata("design:type", String)
], SearchHitDto.prototype, "from", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Relevance score, when the provider reports one.', example: 0.87 }),
    __metadata("design:type", Number)
], SearchHitDto.prototype, "score", void 0);
class SearchResultsResponseDto {
    hits;
    total;
    tookMs;
    provider;
}
exports.SearchResultsResponseDto = SearchResultsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [SearchHitDto] }),
    __metadata("design:type", Array)
], SearchResultsResponseDto.prototype, "hits", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Bounded exact count for pagination.', example: 42 }),
    __metadata("design:type", Number)
], SearchResultsResponseDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'How long the provider took, in milliseconds.', example: 12 }),
    __metadata("design:type", Number)
], SearchResultsResponseDto.prototype, "tookMs", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Which provider answered.', example: 'builtin-fts' }),
    __metadata("design:type", String)
], SearchResultsResponseDto.prototype, "provider", void 0);
//# sourceMappingURL=search-response.dto.js.map