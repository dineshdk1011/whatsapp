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
var BullBoardAuthMiddleware_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BullBoardAuthMiddleware = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const auth_service_1 = require("../../modules/auth/auth.service");
const api_key_entity_1 = require("../../modules/auth/entities/api-key.entity");
const audit_service_1 = require("../../modules/audit/audit.service");
const audit_log_entity_1 = require("../../modules/audit/entities/audit-log.entity");
const auth_failure_audit_limiter_1 = require("../../modules/audit/auth-failure-audit-limiter");
const mcp_rate_limit_1 = require("../../modules/mcp/mcp-rate-limit");
const ip_1 = require("../utils/ip");
const bearer_token_1 = require("./bearer-token");
const request_context_1 = require("../services/request-context");
let BullBoardAuthMiddleware = BullBoardAuthMiddleware_1 = class BullBoardAuthMiddleware {
    authService;
    configService;
    auditService;
    ipRateLimiter;
    constructor(authService, configService, auditService, ipRateLimiter) {
        this.authService = authService;
        this.configService = configService;
        this.auditService = auditService;
        this.ipRateLimiter = ipRateLimiter ?? BullBoardAuthMiddleware_1.createDefaultIpLimiter();
    }
    static createDefaultIpLimiter() {
        const { max, windowMs } = (0, mcp_rate_limit_1.readIpRateLimitConfig)();
        return new mcp_rate_limit_1.KeyRateLimiter(max, windowMs);
    }
    async use(req, _res, next) {
        try {
            const clientIp = this.getClientIp(req);
            this.ipRateLimiter.check((0, ip_1.limiterKeyForIp)(clientIp));
            const rawKey = this.extractKey(req);
            if (!rawKey) {
                throw new auth_service_1.UnresolvedApiKeyException('API key is required to access the queue dashboard');
            }
            const apiKey = await this.authService.validateApiKey(rawKey, clientIp);
            (0, request_context_1.setRequestActor)({ apiKeyId: apiKey.id, apiKeyName: apiKey.name, ipAddress: clientIp });
            if (!this.authService.hasPermission(apiKey, api_key_entity_1.ApiKeyRole.ADMIN)) {
                throw new common_1.ForbiddenException('Admin role required to access the queue dashboard');
            }
            if ((apiKey.allowedSessions?.length ?? 0) > 0) {
                throw new common_1.ForbiddenException('API keys restricted to specific sessions cannot access the queue dashboard');
            }
            if ((apiKey.allowedChats?.length ?? 0) > 0) {
                throw new common_1.ForbiddenException('API keys restricted to selected chats cannot access the queue dashboard');
            }
            if (req.method !== 'GET' && req.method !== 'HEAD') {
                void this.auditService?.logInfo(audit_log_entity_1.AuditAction.QUEUE_BOARD_MUTATED, {
                    apiKey,
                    ipAddress: clientIp,
                    method: req.method,
                    path: this.auditPath(req),
                });
            }
            next();
        }
        catch (err) {
            if (this.auditService && (err instanceof common_1.UnauthorizedException || err instanceof common_1.ForbiddenException)) {
                const clientIp = this.getClientIp(req);
                if (!(err instanceof auth_service_1.UnresolvedApiKeyException) || (0, auth_failure_audit_limiter_1.allowUnauthenticatedAuditRow)(clientIp)) {
                    void this.auditService.logWarn(audit_log_entity_1.AuditAction.API_KEY_AUTH_FAILED, {
                        ipAddress: clientIp,
                        method: req.method,
                        path: this.auditPath(req),
                        errorMessage: err.message,
                    });
                }
            }
            next(err);
        }
    }
    auditPath(req) {
        const url = req.originalUrl ?? req.url ?? '';
        return url.split('?')[0];
    }
    extractKey(req) {
        return (0, bearer_token_1.presentedApiKey)(req.headers);
    }
    getClientIp(req) {
        const trustedProxies = this.configService.get('security.trustedProxies') ?? [];
        return (0, ip_1.resolveClientIp)(req, trustedProxies);
    }
};
exports.BullBoardAuthMiddleware = BullBoardAuthMiddleware;
exports.BullBoardAuthMiddleware = BullBoardAuthMiddleware = BullBoardAuthMiddleware_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        config_1.ConfigService,
        audit_service_1.AuditService,
        mcp_rate_limit_1.KeyRateLimiter])
], BullBoardAuthMiddleware);
//# sourceMappingURL=bull-board-auth.middleware.js.map