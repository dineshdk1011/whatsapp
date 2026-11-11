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
exports.ActiveKeyIndex = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const api_key_entity_1 = require("./entities/api-key.entity");
const api_key_hash_1 = require("./api-key-hash");
const bearer_token_1 = require("../../common/security/bearer-token");
const ip_1 = require("../../common/utils/ip");
const logger_service_1 = require("../../common/services/logger.service");
const REFRESH_INTERVAL_MS = 30_000;
let ActiveKeyIndex = class ActiveKeyIndex {
    apiKeyRepository;
    logger = (0, logger_service_1.createLogger)('ActiveKeyIndex');
    keys = new Map();
    timer;
    loading;
    reloadAgain = false;
    destroyed = false;
    constructor(apiKeyRepository) {
        this.apiKeyRepository = apiKeyRepository;
    }
    async onApplicationBootstrap() {
        this.refreshSoon();
        await this.loading;
        this.timer = setInterval(() => this.refreshSoon(), REFRESH_INTERVAL_MS);
        this.timer.unref();
    }
    onModuleDestroy() {
        this.destroyed = true;
        clearInterval(this.timer);
        this.timer = undefined;
    }
    refreshSoon() {
        if (this.destroyed)
            return;
        if (this.loading) {
            this.reloadAgain = true;
            return;
        }
        this.loading = (async () => {
            try {
                do {
                    this.reloadAgain = false;
                    await this.load();
                } while (this.reloadAgain && !this.destroyed);
            }
            finally {
                this.loading = undefined;
            }
        })();
    }
    recognise(headers, clientIp) {
        const raw = (0, bearer_token_1.presentedApiKey)(headers)?.trim();
        if (!raw)
            return undefined;
        const keyHash = (0, api_key_hash_1.hashApiKey)(raw, process.env.API_KEY_PEPPER);
        const key = this.keys.get(keyHash);
        if (!key)
            return undefined;
        if (key.expiresAt && !(key.expiresAt >= new Date()))
            return undefined;
        if (key.allowedIps?.length && !key.allowedIps.some(entry => (0, ip_1.ipMatches)(clientIp, entry)))
            return undefined;
        return keyHash;
    }
    async load() {
        try {
            const rows = await this.apiKeyRepository.find({
                select: { keyHash: true, allowedIps: true, expiresAt: true },
                where: { isActive: true },
            });
            this.keys = new Map(rows.map(row => [row.keyHash, { allowedIps: row.allowedIps, expiresAt: row.expiresAt }]));
        }
        catch (error) {
            this.logger.warn('Could not refresh the active API key index; keeping the previous one', {
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
};
exports.ActiveKeyIndex = ActiveKeyIndex;
exports.ActiveKeyIndex = ActiveKeyIndex = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(api_key_entity_1.ApiKey, 'main')),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ActiveKeyIndex);
//# sourceMappingURL=active-key-index.js.map