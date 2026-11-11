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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = exports.UnresolvedApiKeyException = void 0;
exports.resolveSeedApiKey = resolveSeedApiKey;
exports.bannerKeyLine = bannerKeyLine;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const crypto_1 = require("crypto");
const ip_1 = require("../../common/utils/ip");
const api_key_hash_1 = require("./api-key-hash");
const api_key_entity_1 = require("./entities/api-key.entity");
const logger_service_1 = require("../../common/services/logger.service");
const request_context_1 = require("../../common/services/request-context");
const bootstrap_key_file_1 = require("./bootstrap-key-file");
const api_key_usage_tracker_service_1 = require("./api-key-usage-tracker.service");
const active_key_index_1 = require("./active-key-index");
const api_key_authorization_1 = require("./api-key-authorization");
const chat_scope_1 = require("../../common/security/chat-scope");
const events_gateway_1 = require("../events/events.gateway");
const bootstrap_security_1 = require("../../config/bootstrap-security");
class UnresolvedApiKeyException extends common_1.UnauthorizedException {
    constructor(message) {
        super(message);
        this.name = common_1.UnauthorizedException.name;
    }
}
exports.UnresolvedApiKeyException = UnresolvedApiKeyException;
function resolveSeedApiKey() {
    const masterKey = process.env.API_MASTER_KEY?.trim();
    if (masterKey) {
        return masterKey;
    }
    if (process.env.ALLOW_DEV_API_KEY === 'true') {
        return 'dev-admin-key';
    }
    return `owa_k1_${(0, crypto_1.randomBytes)(32).toString('hex')}`;
}
function bannerKeyLine(displayKey, isNewKey) {
    if (isNewKey)
        return displayKey;
    if (displayKey.startsWith('('))
        return displayKey;
    return `${displayKey.slice(0, 8)}… (full key in ${(0, bootstrap_key_file_1.bootstrapKeyFilePath)()})`;
}
let AuthService = class AuthService {
    static { AuthService_1 = this; }
    apiKeyRepository;
    usageTracker;
    moduleRef;
    keyIndex;
    logger = (0, logger_service_1.createLogger)('AuthService');
    constructor(apiKeyRepository, usageTracker, moduleRef, keyIndex) {
        this.apiKeyRepository = apiKeyRepository;
        this.usageTracker = usageTracker;
        this.moduleRef = moduleRef;
        this.keyIndex = keyIndex;
    }
    async onModuleInit() {
        const count = await this.apiKeyRepository.count();
        let displayKey;
        let isNewKey = false;
        if (count === 0) {
            displayKey = resolveSeedApiKey();
            await this.seedApiKey(displayKey, 'Default Admin Key', api_key_entity_1.ApiKeyRole.ADMIN);
            isNewKey = true;
            this.keyIndex?.refreshSoon();
            try {
                (0, bootstrap_key_file_1.writeBootstrapKey)(displayKey);
            }
            catch (err) {
                this.logger.warn('Could not save API key file', { error: String(err) });
            }
        }
        else {
            displayKey = (await this.readLiveBootstrapKey()) ?? '(check dashboard for keys)';
        }
        const apiBaseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 2785}`;
        const dashboardUrl = process.env.DASHBOARD_URL || apiBaseUrl;
        this.logger.log('');
        this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        this.logger.log('');
        this.logger.log('  🟢 Welcome to OpenWA - WhatsApp API Gateway');
        this.logger.log('');
        this.logger.log(`  📊 Dashboard: ${dashboardUrl}`);
        if ((0, bootstrap_security_1.isSwaggerEnabled)(process.env.ENABLE_SWAGGER, process.env.NODE_ENV)) {
            this.logger.log(`  📚 API Docs:  ${apiBaseUrl}/api/docs`);
        }
        this.logger.log('');
        if (isNewKey) {
            this.logger.log('  🔑 API Key (newly created):');
        }
        else {
            this.logger.log('  🔑 API Key:');
        }
        this.logger.log(`     ${bannerKeyLine(displayKey, isNewKey)}`);
        this.logger.log('');
        this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        this.logger.log('');
    }
    async onModuleDestroy() {
        await this.usageTracker.flushOnShutdown();
    }
    async readLiveBootstrapKey() {
        const rawKey = (0, bootstrap_key_file_1.readBootstrapKey)(this.logger);
        if (!rawKey)
            return null;
        const stored = await this.apiKeyRepository.findOne({ where: { keyHash: this.hashKey(rawKey) } });
        const live = Boolean(stored && stored.isActive && (!stored.expiresAt || stored.expiresAt > new Date()));
        if (live)
            return rawKey;
        if (!stored) {
            const byPrefix = await this.apiKeyRepository.findOne({ where: { keyPrefix: rawKey.substring(0, 12) } });
            if (byPrefix) {
                this.logger.warn('Bootstrap API key file does not match any stored key hash — API_KEY_PEPPER changed since the key was seeded? The key itself is still live, so the file is kept; restore the original pepper, or clear the api_keys table and restart to seed a new admin key.', { keyPrefix: byPrefix.keyPrefix, action: 'bootstrap_key_pepper_mismatch' });
                return null;
            }
        }
        (0, bootstrap_key_file_1.removeBootstrapKey)('it no longer resolves to an active key', this.logger);
        return null;
    }
    removeBootstrapKeyFileIfMatching(apiKey) {
        const fileKey = (0, bootstrap_key_file_1.readBootstrapKey)(this.logger);
        if (!fileKey || this.hashKey(fileKey) !== apiKey.keyHash)
            return;
        (0, bootstrap_key_file_1.removeBootstrapKey)('its key was revoked or deleted', this.logger);
    }
    async seedApiKey(rawKey, name, role) {
        const keyHash = this.hashKey(rawKey);
        const keyPrefix = rawKey.substring(0, 12);
        const apiKey = this.apiKeyRepository.create({
            name,
            keyHash,
            keyPrefix,
            role,
        });
        return this.apiKeyRepository.save(apiKey);
    }
    async createApiKey(dto) {
        const rawKey = `owa_k1_${(0, crypto_1.randomBytes)(32).toString('hex')}`;
        const keyHash = this.hashKey(rawKey);
        const keyPrefix = rawKey.substring(0, 12);
        const apiKey = this.apiKeyRepository.create({
            name: dto.name,
            keyHash,
            keyPrefix,
            role: dto.role || api_key_entity_1.ApiKeyRole.OPERATOR,
            allowedIps: dto.allowedIps || null,
            allowedSessions: (0, api_key_authorization_1.normalizeScopeList)(dto.allowedSessions),
            allowedChats: (0, chat_scope_1.normalizeChatAllowList)(dto.allowedChats),
            expiresAt: dto.expiresAt ? AuthService_1.parseExpiry(dto.expiresAt) : null,
        });
        const saved = await this.apiKeyRepository.save(apiKey);
        this.keyIndex?.refreshSoon();
        this.logger.log(`API key created: ${saved.name}`, {
            keyId: saved.id,
            role: saved.role,
            action: 'api_key_created',
        });
        return { apiKey: saved, rawKey };
    }
    async findAll() {
        return this.apiKeyRepository.find({
            order: { createdAt: 'DESC' },
        });
    }
    async findOne(id) {
        const apiKey = await this.apiKeyRepository.findOne({ where: { id } });
        if (!apiKey) {
            throw new common_1.NotFoundException(`API key with id '${id}' not found`);
        }
        return apiKey;
    }
    async update(id, dto) {
        const apiKey = await this.findOne(id);
        const stripsAdmin = (dto.role !== undefined && dto.role !== api_key_entity_1.ApiKeyRole.ADMIN) ||
            ((0, api_key_authorization_1.normalizeScopeList)(dto.allowedSessions)?.length ?? 0) > 0 ||
            ((0, chat_scope_1.normalizeChatAllowList)(dto.allowedChats)?.length ?? 0) > 0;
        const expiry = dto.expiresAt ? AuthService_1.parseExpiry(dto.expiresAt) : null;
        const setsExpiry = expiry !== null;
        const removesOrSchedulesLastAdmin = stripsAdmin || setsExpiry;
        const before = {
            role: apiKey.role,
            allowedIps: apiKey.allowedIps,
            allowedSessions: apiKey.allowedSessions,
            allowedChats: apiKey.allowedChats,
            expiresAt: apiKey.expiresAt,
        };
        const patch = {};
        if (dto.name)
            patch.name = dto.name;
        if (dto.role)
            patch.role = dto.role;
        if (dto.allowedIps !== undefined)
            patch.allowedIps = dto.allowedIps;
        if (dto.allowedSessions !== undefined)
            patch.allowedSessions = (0, api_key_authorization_1.normalizeScopeList)(dto.allowedSessions);
        if (dto.allowedChats !== undefined)
            patch.allowedChats = (0, chat_scope_1.normalizeChatAllowList)(dto.allowedChats);
        if (dto.expiresAt !== undefined)
            patch.expiresAt = expiry;
        let saved;
        if (removesOrSchedulesLastAdmin) {
            const result = await this.withLastAdminGuard(this.apiKeyRepository.createQueryBuilder().update(api_key_entity_1.ApiKey).set(patch), id, stripsAdmin ? undefined : (expiry ?? undefined)).execute();
            await this.assertMutationApplied(id, result.affected);
            saved = await this.findOne(id);
        }
        else {
            await this.applyUnguardedUpdate(patch, id);
            saved = await this.findOne(id);
        }
        this.keyIndex?.refreshSoon();
        if ((0, api_key_authorization_1.apiKeyAuthorizationFingerprint)(saved) !== (0, api_key_authorization_1.apiKeyAuthorizationFingerprint)(before)) {
            this.evictActiveSockets(id, 'authorization_changed');
        }
        return saved;
    }
    async delete(id) {
        const apiKey = await this.findOne(id);
        const result = await this.withLastAdminGuard(this.apiKeyRepository.createQueryBuilder().delete().from(api_key_entity_1.ApiKey), id).execute();
        await this.assertMutationApplied(id, result.affected);
        this.usageTracker.forget(id);
        this.removeBootstrapKeyFileIfMatching(apiKey);
        this.evictActiveSockets(id, 'deleted');
        this.keyIndex?.refreshSoon();
        this.logger.log(`API key deleted: ${apiKey.name}`, {
            keyId: id,
            action: 'api_key_deleted',
        });
    }
    async revoke(id) {
        const apiKey = await this.findOne(id);
        const result = await this.withLastAdminGuard(this.apiKeyRepository.createQueryBuilder().update(api_key_entity_1.ApiKey).set({ isActive: false }), id).execute();
        await this.assertMutationApplied(id, result.affected);
        const saved = await this.findOne(id);
        this.usageTracker.forget(id);
        this.removeBootstrapKeyFileIfMatching(apiKey);
        this.evictActiveSockets(id, 'revoked');
        this.keyIndex?.refreshSoon();
        return saved;
    }
    static parseExpiry(value) {
        const at = new Date(value);
        if (Number.isNaN(at.getTime()))
            throw new common_1.BadRequestException('expiresAt is not a parseable date');
        return at;
    }
    static usableAdminCondition(prefix) {
        const col = (name) => (prefix ? `"${prefix}"."${name}"` : `"${name}"`);
        return (`${col('role')} = :adminRole AND ${col('isActive')} = 1 AND ` +
            `(${col('expiresAt')} IS NULL OR ${col('expiresAt')} > :guardNow) AND ` +
            `(${col('allowedSessions')} = '' OR ${col('allowedSessions')} IS NULL) AND ` +
            `(${col('allowedChats')} = '' OR ${col('allowedChats')} IS NULL)`);
    }
    static guardNowParam(at = new Date()) {
        return at.toISOString().slice(0, 23).replace('T', ' ');
    }
    static OUTLASTS_TARGET = `("other"."expiresAt" IS NULL OR ` +
        `("api_keys"."expiresAt" IS NOT NULL AND "other"."expiresAt" >= "api_keys"."expiresAt"))`;
    withLastAdminGuard(qb, id, extendsTo) {
        const extension = extendsTo ? `("expiresAt" IS NOT NULL AND "expiresAt" <= :extendsTo) OR ` : '';
        return qb
            .where('"id" = :id', { id })
            .andWhere(`(NOT (${AuthService_1.usableAdminCondition('')}) OR ${extension}EXISTS (` +
            `SELECT 1 FROM "api_keys" "other" WHERE "other"."id" <> :id AND ${AuthService_1.usableAdminCondition('other')} AND ` +
            `${AuthService_1.OUTLASTS_TARGET}))`)
            .setParameters({
            adminRole: api_key_entity_1.ApiKeyRole.ADMIN,
            guardNow: AuthService_1.guardNowParam(),
            ...(extendsTo && { extendsTo: AuthService_1.guardNowParam(extendsTo) }),
        });
    }
    async assertMutationApplied(id, affected) {
        if (affected)
            return;
        await this.findOne(id);
        throw new common_1.ConflictException('Cannot remove the last active admin key: no other admin key lasts as long');
    }
    async applyUnguardedUpdate(patch, id) {
        const result = await this.apiKeyRepository
            .createQueryBuilder()
            .update(api_key_entity_1.ApiKey)
            .set(patch)
            .where('"id" = :id', { id })
            .execute();
        if (!result.affected) {
            await this.findOne(id);
        }
    }
    evictActiveSockets(keyId, reason = 'revoked') {
        try {
            const gateway = this.moduleRef.get(events_gateway_1.EventsGateway, { strict: false });
            if (gateway) {
                gateway.evictApiKey(keyId, reason);
            }
        }
        catch (error) {
            this.logger.warn(`Failed to evict WebSocket sockets for key ${keyId}`, {
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    async findAuthorizationStates(ids) {
        if (ids.length === 0)
            return [];
        return this.apiKeyRepository.findBy({ id: (0, typeorm_2.In)(ids) });
    }
    async validateApiKey(rawKey, clientIp, sessionId, { recordUsage = true } = {}) {
        const keyHash = this.hashKey(rawKey?.trim());
        const apiKey = await this.apiKeyRepository.findOne({ where: { keyHash } });
        if (!apiKey) {
            throw new UnresolvedApiKeyException('Invalid API key');
        }
        (0, request_context_1.setRequestActor)({ apiKeyId: apiKey.id, apiKeyName: apiKey.name });
        if (!apiKey.isActive) {
            throw new common_1.UnauthorizedException('API key is revoked');
        }
        if (apiKey.expiresAt && !(apiKey.expiresAt >= new Date())) {
            throw new common_1.UnauthorizedException('API key has expired');
        }
        if (apiKey.allowedIps && apiKey.allowedIps.length > 0) {
            if (!clientIp) {
                throw new common_1.ForbiddenException('Client IP could not be determined');
            }
            if (!this.isIpAllowed(clientIp, apiKey.allowedIps)) {
                this.logger.warn(`IP not allowed: ${clientIp}`, {
                    keyId: apiKey.id,
                    action: 'ip_rejected',
                });
                throw new common_1.ForbiddenException('IP address not allowed');
            }
        }
        if (apiKey.allowedSessions && apiKey.allowedSessions.length > 0 && sessionId) {
            if (!apiKey.allowedSessions.includes(sessionId)) {
                throw new common_1.ForbiddenException('API key not authorized for this session');
            }
        }
        if (recordUsage)
            await this.usageTracker.record(apiKey);
        return apiKey;
    }
    hashKey(rawKey) {
        return (0, api_key_hash_1.hashApiKey)(rawKey, process.env.API_KEY_PEPPER);
    }
    isIpAllowed(clientIp, allowedIps) {
        return allowedIps.some(entry => (0, ip_1.ipMatches)(clientIp, entry));
    }
    hasPermission(apiKey, requiredRole) {
        const roleHierarchy = {
            [api_key_entity_1.ApiKeyRole.VIEWER]: 1,
            [api_key_entity_1.ApiKeyRole.OPERATOR]: 2,
            [api_key_entity_1.ApiKeyRole.ADMIN]: 3,
        };
        return roleHierarchy[apiKey.role] >= roleHierarchy[requiredRole];
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(api_key_entity_1.ApiKey, 'main')),
    __param(3, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        api_key_usage_tracker_service_1.ApiKeyUsageTracker,
        core_1.ModuleRef,
        active_key_index_1.ActiveKeyIndex])
], AuthService);
//# sourceMappingURL=auth.service.js.map