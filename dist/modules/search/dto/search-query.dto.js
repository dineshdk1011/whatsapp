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
exports.SearchQueryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const message_entity_1 = require("../../message/entities/message.entity");
const strict_boolean_1 = require("../../../common/utils/strict-boolean");
const no_nul_character_1 = require("../../../common/validation/no-nul-character");
const search_constants_1 = require("../search.constants");
class SearchQueryDto {
    q;
    match;
    sessionId;
    chatId;
    from;
    direction;
    type;
    dateFrom;
    dateTo;
    limit;
    offset;
}
exports.SearchQueryDto = SearchQueryDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: `Search term (required, non-empty, at most ${search_constants_1.SEARCH_QUERY_MAX_LENGTH} characters and ${search_constants_1.SEARCH_TERMS_MAX} words, no NUL character)`,
        maxLength: search_constants_1.SEARCH_QUERY_MAX_LENGTH,
    }),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(search_constants_1.SEARCH_QUERY_MAX_LENGTH),
    (0, no_nul_character_1.NoNulCharacter)(),
    __metadata("design:type", String)
], SearchQueryDto.prototype, "q", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: search_constants_1.SEARCH_MATCH_MODES,
        default: 'word',
        description: '`word` (default) matches whole words. `contains` matches any part of a word, ignoring case and ' +
            `accents (\`voic\` finds "Invoice", \`cafe\` finds "Café"); it is opt-in on the built-in provider ` +
            '(SEARCH_CONTAINS_ENABLED=true, else 501) and needs at least one term of ' +
            `${search_constants_1.SEARCH_CONTAINS_MIN_TERM_LENGTH} or more characters (on PostgreSQL, ${search_constants_1.SEARCH_CONTAINS_MIN_TERM_LENGTH} letters or digits in a row) ` +
            `and at most ${search_constants_1.SEARCH_CONTAINS_TERMS_MAX_LENGTH} characters in all its terms, spaces not counted (400 otherwise), so a ` +
            'query of two-character words alone, as most Korean and many Chinese and Japanese words are, needs `word`. ' +
            `It ranks the ${search_constants_1.SEARCH_CONTAINS_WINDOW} most recently stored matches by match quality, so \`total\` is at most ` +
            `${search_constants_1.SEARCH_CONTAINS_WINDOW}.`,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(search_constants_1.SEARCH_MATCH_MODES),
    __metadata("design:type", String)
], SearchQueryDto.prototype, "match", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Restrict to a single session' }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchQueryDto.prototype, "sessionId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: "Restrict to a single chat id. With the built-in search provider, a phone also matches the chat's other stored forms (the other user dialect and any lid that resolves to it); a plugin provider receives the id as sent.",
    }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchQueryDto.prototype, "chatId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: "Sender filter. With the built-in search provider, matches `from` or a group message's `author`, and a phone also matches any lid that resolves to it; a plugin provider receives the id as sent.",
    }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchQueryDto.prototype, "from", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: message_entity_1.MessageDirection, description: 'incoming | outgoing' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(message_entity_1.MessageDirection),
    __metadata("design:type", String)
], SearchQueryDto.prototype, "direction", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Message type filter (compared against stored messages.type)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchQueryDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Epoch-ms lower bound (inclusive)',
        type: Number,
        minimum: -Number.MAX_SAFE_INTEGER,
        maximum: Number.MAX_SAFE_INTEGER,
    }),
    (0, strict_boolean_1.ToStrictNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(-Number.MAX_SAFE_INTEGER),
    (0, class_validator_1.Max)(Number.MAX_SAFE_INTEGER),
    __metadata("design:type", Number)
], SearchQueryDto.prototype, "dateFrom", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Epoch-ms upper bound (inclusive)',
        type: Number,
        minimum: -Number.MAX_SAFE_INTEGER,
        maximum: Number.MAX_SAFE_INTEGER,
    }),
    (0, strict_boolean_1.ToStrictNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(-Number.MAX_SAFE_INTEGER),
    (0, class_validator_1.Max)(Number.MAX_SAFE_INTEGER),
    __metadata("design:type", Number)
], SearchQueryDto.prototype, "dateTo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Max hits to return', type: 'integer', minimum: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], SearchQueryDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: `Pagination offset, at most ${search_constants_1.SEARCH_OFFSET_MAX}`,
        type: 'integer',
        minimum: 0,
        maximum: search_constants_1.SEARCH_OFFSET_MAX,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(search_constants_1.SEARCH_OFFSET_MAX),
    __metadata("design:type", Number)
], SearchQueryDto.prototype, "offset", void 0);
//# sourceMappingURL=search-query.dto.js.map