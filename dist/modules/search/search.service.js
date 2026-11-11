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
exports.SearchService = void 0;
const common_1 = require("@nestjs/common");
const search_provider_registry_1 = require("./search-provider.registry");
const search_constants_1 = require("./search.constants");
const search_terms_1 = require("./search-terms");
const chat_scope_service_1 = require("../auth/chat-scope.service");
const wa_id_1 = require("../../engine/identity/wa-id");
function bareUserDigits(id) {
    const { kind, userPart } = (0, wa_id_1.parseWaId)(id);
    return kind === 'user' && /^\d+$/.test(userPart) ? [userPart] : [];
}
let SearchService = class SearchService {
    registry;
    chatScope;
    constructor(registry, chatScope) {
        this.registry = registry;
        this.chatScope = chatScope;
    }
    async search(query, callerSessionIds, callerChatIds) {
        const provider = this.registry.active();
        if (!provider)
            throw new common_1.NotImplementedException('Search is not configured (no active search provider).');
        if ((0, search_terms_1.searchTermCount)(query.q) > search_constants_1.SEARCH_TERMS_MAX) {
            throw new common_1.BadRequestException(`q may hold at most ${search_constants_1.SEARCH_TERMS_MAX} words, punctuation included.`);
        }
        const [chatIdAliases, fromAliases] = await Promise.all([
            query.chatId ? this.chatScope?.candidatesFor(query.chatId) : undefined,
            query.from ? this.chatScope?.candidatesFor(query.from) : undefined,
        ]);
        const scoped = {
            ...query,
            chatIdAliases,
            fromAliases: fromAliases && [...new Set([...fromAliases, ...fromAliases.flatMap(bareUserDigits)])],
            sessionIds: callerSessionIds,
            chatIds: callerChatIds,
            limit: Math.min(query.limit ?? search_constants_1.SEARCH_DEFAULT_LIMIT, search_constants_1.SEARCH_LIMIT_MAX),
            offset: Math.min(query.offset ?? 0, search_constants_1.SEARCH_OFFSET_MAX),
        };
        return provider.search(scoped);
    }
    async health() {
        const provider = this.registry.active();
        if (!provider)
            return { ok: false, detail: 'no provider' };
        return provider.health();
    }
};
exports.SearchService = SearchService;
exports.SearchService = SearchService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [search_provider_registry_1.SearchProviderRegistry,
        chat_scope_service_1.ChatScopeService])
], SearchService);
//# sourceMappingURL=search.service.js.map