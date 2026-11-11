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
var ApiKeyUsageTracker_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKeyUsageTracker = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const api_key_entity_1 = require("./entities/api-key.entity");
const logger_service_1 = require("../../common/services/logger.service");
let ApiKeyUsageTracker = class ApiKeyUsageTracker {
    static { ApiKeyUsageTracker_1 = this; }
    apiKeyRepository;
    logger = (0, logger_service_1.createLogger)('ApiKeyUsageTracker');
    static STAT_FLUSH_INTERVAL_MS = 60_000;
    static SHUTDOWN_FLUSH_TIMEOUT_MS = 5_000;
    pending = new Map();
    constructor(apiKeyRepository) {
        this.apiKeyRepository = apiKeyRepository;
    }
    async record(apiKey) {
        const pending = (this.pending.get(apiKey.id) ?? 0) + 1;
        const previousLastUsedAt = apiKey.lastUsedAt;
        apiKey.lastUsedAt = new Date();
        apiKey.usageCount += pending;
        const due = !previousLastUsedAt ||
            apiKey.lastUsedAt.getTime() - previousLastUsedAt.getTime() >= ApiKeyUsageTracker_1.STAT_FLUSH_INTERVAL_MS;
        if (!due) {
            this.pending.set(apiKey.id, pending);
            return;
        }
        this.pending.delete(apiKey.id);
        try {
            await this.apiKeyRepository.update({ id: apiKey.id }, { lastUsedAt: apiKey.lastUsedAt, usageCount: () => `"usageCount" + ${pending}` });
        }
        catch (error) {
            this.pending.set(apiKey.id, (this.pending.get(apiKey.id) ?? 0) + pending);
            this.logger.warn('Usage-stat write failed; delta kept pending for the next flush', {
                keyId: apiKey.id,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    forget(keyId) {
        this.pending.delete(keyId);
    }
    async flushOnShutdown() {
        if (this.pending.size === 0)
            return;
        this.logger.log(`Flushing usage stats for ${this.pending.size} API key(s) before shutdown`);
        const timeout = new Promise(resolve => setTimeout(() => resolve('timeout'), ApiKeyUsageTracker_1.SHUTDOWN_FLUSH_TIMEOUT_MS).unref());
        const result = await Promise.race([this.flushPending().then(() => 'done'), timeout]);
        if (result === 'timeout') {
            this.logger.warn('Usage-stat shutdown flush exceeded its time bound; remaining deltas dropped');
        }
    }
    async flushPending() {
        const batch = [...this.pending.entries()];
        this.pending.clear();
        for (const [keyId, delta] of batch) {
            if (delta <= 0)
                continue;
            try {
                await this.apiKeyRepository.increment({ id: keyId }, 'usageCount', delta);
            }
            catch (error) {
                this.pending.set(keyId, (this.pending.get(keyId) ?? 0) + delta);
                this.logger.warn('Usage-stat flush failed for a key; delta kept pending', {
                    keyId,
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        }
    }
};
exports.ApiKeyUsageTracker = ApiKeyUsageTracker;
exports.ApiKeyUsageTracker = ApiKeyUsageTracker = ApiKeyUsageTracker_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(api_key_entity_1.ApiKey, 'main')),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ApiKeyUsageTracker);
//# sourceMappingURL=api-key-usage-tracker.service.js.map