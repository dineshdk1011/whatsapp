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
exports.ConversationMappingService = exports.ConversationMappingConflict = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const conversation_mapping_entity_1 = require("./entities/conversation-mapping.entity");
const db_errors_1 = require("../../common/utils/db-errors");
const lid_mapping_store_service_1 = require("../../engine/identity/lid-mapping-store.service");
const wa_id_1 = require("../../engine/identity/wa-id");
class ConversationMappingConflict extends Error {
    key;
    providerConversationId;
    constructor(key, providerConversationId) {
        super(`conversation mapping conflict: providerConversationId "${providerConversationId}" is already bound to ` +
            `a different chat for plugin "${key.pluginId}" instance "${key.instanceId}"`);
        this.key = key;
        this.providerConversationId = providerConversationId;
        this.name = 'ConversationMappingConflict';
    }
}
exports.ConversationMappingConflict = ConversationMappingConflict;
let ConversationMappingService = class ConversationMappingService {
    repo;
    lidMappingStore;
    constructor(repo, lidMappingStore) {
        this.repo = repo;
        this.lidMappingStore = lidMappingStore;
    }
    async upsert(key, providerConversationId, patch) {
        const existing = await this.repo.findOne({ where: key });
        if (existing) {
            await this.updateById(existing.id, key, providerConversationId, patch);
            return;
        }
        try {
            const handoverState = await this.inheritedHandover(key);
            await this.repo.insert({
                ...key,
                providerConversationId,
                handoverState,
                ...patch,
            });
            if (!patch?.handoverState && handoverState !== 'bot') {
                const current = await this.inheritedHandover(key);
                if (current !== handoverState)
                    await this.repo.update({ ...key }, { handoverState: current });
            }
        }
        catch (err) {
            if (!(0, db_errors_1.isUniqueViolation)(err))
                throw err;
            const raced = await this.repo.findOne({ where: key });
            if (raced) {
                await this.updateById(raced.id, key, providerConversationId, patch);
                return;
            }
            throw new ConversationMappingConflict(key, providerConversationId);
        }
    }
    async updateById(id, key, providerConversationId, patch) {
        try {
            await this.repo.update({ id }, {
                providerConversationId,
                ...patch,
            });
        }
        catch (err) {
            if ((0, db_errors_1.isUniqueViolation)(err))
                throw new ConversationMappingConflict(key, providerConversationId);
            throw err;
        }
    }
    async releaseTakeovers(pluginId) {
        await this.repo.update({ pluginId, handoverState: (0, typeorm_2.In)(['human', 'closed']) }, { handoverState: 'bot' });
    }
    get(key) {
        return this.repo.findOne({ where: key });
    }
    async findHandoverForChat(sessionId, chatId) {
        const rows = await this.repo.find({
            where: { sessionId, chatId: (0, typeorm_2.In)(await this.chatIdAliases(chatId)) },
            order: { updatedAt: 'DESC' },
        });
        const held = rows.find(row => row.handoverState === 'human' || row.handoverState === 'closed');
        return held ? { pluginId: held.pluginId, handoverState: held.handoverState } : null;
    }
    async inheritedHandover(key) {
        const others = (await this.chatIdAliases(key.chatId)).filter(id => id !== key.chatId);
        if (!others.length)
            return 'bot';
        const prior = await this.repo.find({ where: { ...key, chatId: (0, typeorm_2.In)(others) } });
        return prior.find(row => row.handoverState !== 'bot')?.handoverState ?? 'bot';
    }
    async chatIdAliases(chatId) {
        const ids = new Set([chatId]);
        const { kind, userPart } = (0, wa_id_1.parseWaId)(chatId);
        const store = this.lidMappingStore;
        const phone = kind === 'lid' ? await store?.findPhoneForLid(userPart) : kind === 'user' ? userPart : null;
        if (phone && store) {
            ids.add(`${phone}@c.us`);
            for (const lid of await store.findLidsForPhone(phone))
                ids.add(`${lid}@lid`);
        }
        return [...ids];
    }
    getByProvider(pluginId, instanceId, providerConversationId) {
        return this.repo.findOne({ where: { pluginId, instanceId, providerConversationId } });
    }
    async setHandover(id, state) {
        const row = await this.repo.findOne({ where: { id } });
        if (!row)
            return;
        const { sessionId, pluginId, instanceId } = row;
        const chatId = (0, typeorm_2.In)(await this.chatIdAliases(row.chatId));
        await this.repo.update({ sessionId, pluginId, instanceId, chatId }, { handoverState: state });
    }
    async delete(id) {
        await this.repo.delete({ id });
    }
    async rebindSession(id, sessionId) {
        try {
            await this.repo.update({ id }, { sessionId });
        }
        catch (err) {
            if (!(0, db_errors_1.isUniqueViolation)(err))
                throw err;
            await this.repo.delete({ id });
        }
    }
};
exports.ConversationMappingService = ConversationMappingService;
exports.ConversationMappingService = ConversationMappingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(conversation_mapping_entity_1.ConversationMapping, 'data')),
    __param(1, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        lid_mapping_store_service_1.LidMappingStoreService])
], ConversationMappingService);
//# sourceMappingURL=conversation-mapping.service.js.map