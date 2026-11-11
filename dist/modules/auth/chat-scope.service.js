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
exports.ChatScopeService = void 0;
const common_1 = require("@nestjs/common");
const lid_mapping_store_service_1 = require("../../engine/identity/lid-mapping-store.service");
const jid_candidates_1 = require("../../engine/identity/jid-candidates");
const chat_scope_1 = require("../../common/security/chat-scope");
let ChatScopeService = class ChatScopeService {
    lidStore;
    constructor(lidStore) {
        this.lidStore = lidStore;
    }
    isRestricted(apiKey) {
        return (0, chat_scope_1.isChatScopeRestricted)(apiKey?.allowedChats);
    }
    requireChat(apiKey, chatId) {
        if (this.isRestricted(apiKey) && !chatId?.trim()) {
            throw new common_1.ForbiddenException('chatId is required for a key restricted to selected chats');
        }
    }
    scopeFor(apiKey) {
        return (0, chat_scope_1.buildChatScope)(apiKey?.allowedChats ?? null);
    }
    allows(apiKey, chatId) {
        return (0, chat_scope_1.chatIdAllowed)(this.scopeFor(apiKey), chatId, this.singleDirectory());
    }
    async candidatesFor(id) {
        return [...new Set([id, ...(await (0, jid_candidates_1.resolveJidCandidates)(id, this.singleDirectory()))])];
    }
    scopeForFilter(apiKey) {
        return (0, chat_scope_1.buildExpandedChatScope)(apiKey?.allowedChats ?? null, this.batchDirectory());
    }
    async idsForFilter(apiKey) {
        const scope = await this.scopeForFilter(apiKey);
        return scope ? [...scope.allowed] : undefined;
    }
    async filter(apiKey, items, chatIdOf) {
        return (0, chat_scope_1.filterByChatScope)(await this.scopeForFilter(apiKey), items, chatIdOf);
    }
    singleDirectory() {
        const store = this.lidStore;
        if (!store)
            return undefined;
        return {
            resolveLid: userPart => store.findPhoneForLid(userPart),
            lidsForPhone: phone => store.findLidsForPhone(phone),
        };
    }
    batchDirectory() {
        const store = this.lidStore;
        if (!store)
            return undefined;
        return {
            phonesForLids: lids => store.phonesForLidsPersisted(lids),
            lidsForPhones: phones => store.lidsForPhonesPersisted(phones),
        };
    }
};
exports.ChatScopeService = ChatScopeService;
exports.ChatScopeService = ChatScopeService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [lid_mapping_store_service_1.LidMappingStoreService])
], ChatScopeService);
//# sourceMappingURL=chat-scope.service.js.map