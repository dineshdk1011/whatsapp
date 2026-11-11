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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const search_response_dto_1 = require("./dto/search-response.dto");
const auth_decorators_1 = require("../auth/decorators/auth.decorators");
const chat_scope_service_1 = require("../auth/chat-scope.service");
const api_key_entity_1 = require("../auth/entities/api-key.entity");
const search_service_1 = require("./search.service");
const search_query_dto_1 = require("./dto/search-query.dto");
const search_constants_1 = require("./search.constants");
let SearchController = class SearchController {
    searchService;
    chatScope;
    constructor(searchService, chatScope) {
        this.searchService = searchService;
        this.chatScope = chatScope;
    }
    async search(dto, apiKey) {
        if (!dto.q || !dto.q.trim()) {
            throw new common_1.BadRequestException('Query parameter "q" is required and must be non-empty.');
        }
        const chatIds = await this.chatScope.idsForFilter(apiKey);
        return this.searchService.search(dto, apiKey?.allowedSessions ?? undefined, chatIds);
    }
};
exports.SearchController = SearchController;
__decorate([
    (0, auth_decorators_1.ChatScoped)('filtered'),
    (0, common_1.Get)(),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Search messages across sessions (active search provider)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Search results from the active provider', type: search_response_dto_1.SearchResultsResponseDto }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Empty or whitespace-only "q", or one over 1000 characters or 32 words or holding a NUL character; an ' +
            'unknown "match"; or a "match=contains" query with no term of 3 or more characters (on PostgreSQL, 3 ' +
            `letters or digits in a row) or with more than ${search_constants_1.SEARCH_CONTAINS_TERMS_MAX_LENGTH} characters in its terms`,
    }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Chat scope denied or chat-restricted search uses a plugin provider' }),
    (0, swagger_1.ApiResponse)({
        status: 501,
        description: 'No search provider configured, or the built-in provider lacks the index the requested match mode needs ' +
            '(for "match=contains": SEARCH_CONTAINS_ENABLED=true and a finished index build, and on PostgreSQL the ' +
            'pg_trgm and unaccent extensions)',
    }),
    (0, swagger_1.ApiResponse)({
        status: 502,
        description: 'The active plugin search provider returned a result shape that failed validation, so nothing ' +
            'trustworthy could be forwarded. The built-in provider never returns this.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'The active plugin search provider did not answer: its worker is not running, timed out, or reported ' +
            'a failure. The built-in provider never returns this. Retryable.',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'q',
        required: true,
        description: 'Search term (required, non-empty, at most 1000 characters and 32 words, no NUL character)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'match',
        required: false,
        enum: search_constants_1.SEARCH_MATCH_MODES,
        description: 'word (default): whole words. contains: any part of a word, ignoring case and accents; ranks the ' +
            `${search_constants_1.SEARCH_CONTAINS_WINDOW} most recently stored matches by match quality; needs SEARCH_CONTAINS_ENABLED=true, ` +
            `a term of 3 or more characters and at most ${search_constants_1.SEARCH_CONTAINS_TERMS_MAX_LENGTH} characters in all its terms`,
    }),
    (0, swagger_1.ApiQuery)({ name: 'sessionId', required: false, description: 'Restrict to a single session' }),
    (0, swagger_1.ApiQuery)({
        name: 'chatId',
        required: false,
        description: "Restrict to a single chat id. With the built-in search provider, a phone also matches the chat's other stored forms (the other user dialect and any lid that resolves to it); a plugin provider receives the id as sent.",
    }),
    (0, swagger_1.ApiQuery)({ name: 'direction', required: false, description: 'incoming | outgoing' }),
    (0, swagger_1.ApiQuery)({ name: 'type', required: false, description: 'Message type filter' }),
    (0, swagger_1.ApiQuery)({
        name: 'from',
        required: false,
        description: "Sender filter. With the built-in search provider, matches `from` or a group message's `author`, and a phone also matches any lid that resolves to it; a plugin provider receives the id as sent.",
    }),
    (0, swagger_1.ApiQuery)({ name: 'dateFrom', required: false, description: 'Epoch-ms lower bound (inclusive)' }),
    (0, swagger_1.ApiQuery)({ name: 'dateTo', required: false, description: 'Epoch-ms upper bound (inclusive)' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: 'integer', description: 'Max hits to return' }),
    (0, swagger_1.ApiQuery)({
        name: 'offset',
        required: false,
        type: 'integer',
        description: `Pagination offset, at most ${search_constants_1.SEARCH_OFFSET_MAX}`,
    }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, auth_decorators_1.CurrentApiKey)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [search_query_dto_1.SearchQueryDto, api_key_entity_1.ApiKey]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "search", null);
exports.SearchController = SearchController = __decorate([
    (0, swagger_1.ApiTags)('search'),
    (0, common_1.Controller)('search'),
    __metadata("design:paramtypes", [search_service_1.SearchService,
        chat_scope_service_1.ChatScopeService])
], SearchController);
//# sourceMappingURL=search.controller.js.map