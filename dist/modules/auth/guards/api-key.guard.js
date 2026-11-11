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
var ApiKeyGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKeyGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const auth_service_1 = require("../auth.service");
const chat_scope_service_1 = require("../chat-scope.service");
const bulk_message_dto_1 = require("../../message/dto/bulk-message.dto");
const auth_decorators_1 = require("../decorators/auth.decorators");
const ip_1 = require("../../../common/utils/ip");
const bearer_token_1 = require("../../../common/security/bearer-token");
const request_context_1 = require("../../../common/services/request-context");
const audit_service_1 = require("../../audit/audit.service");
const audit_log_entity_1 = require("../../audit/entities/audit-log.entity");
const auth_failure_audit_limiter_1 = require("../../audit/auth-failure-audit-limiter");
let ApiKeyGuard = class ApiKeyGuard {
    static { ApiKeyGuard_1 = this; }
    authService;
    reflector;
    configService;
    auditService;
    chatScope;
    constructor(authService, reflector, configService, auditService, chatScope) {
        this.authService = authService;
        this.reflector = reflector;
        this.configService = configService;
        this.auditService = auditService;
        this.chatScope = chatScope;
    }
    async canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(auth_decorators_1.PUBLIC_KEY, [context.getHandler(), context.getClass()]);
        if (isPublic) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        try {
            return await this.authorize(request, context);
        }
        catch (err) {
            if (err instanceof common_1.UnauthorizedException || err instanceof common_1.ForbiddenException) {
                const clientIp = this.getClientIp(request);
                (0, request_context_1.setRequestActor)({ ipAddress: clientIp });
                if (!(err instanceof auth_service_1.UnresolvedApiKeyException) || (0, auth_failure_audit_limiter_1.allowUnauthenticatedAuditRow)(clientIp)) {
                    void this.auditService.logWarn(audit_log_entity_1.AuditAction.API_KEY_AUTH_FAILED, {
                        ipAddress: clientIp,
                        method: request.method,
                        path: request.path,
                        errorMessage: err.message,
                    });
                }
            }
            throw err;
        }
    }
    async authorize(request, context) {
        const apiKeyHeader = this.extractApiKey(request);
        if (!apiKeyHeader) {
            throw new auth_service_1.UnresolvedApiKeyException('API key is required');
        }
        const requiredRole = this.reflector.getAllAndOverride(auth_decorators_1.REQUIRED_ROLE_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        const sessionScoped = this.reflector.getAllAndOverride(auth_decorators_1.SESSION_SCOPED_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        const sessionId = (request.params['sessionId'] || (sessionScoped ? request.params['id'] : undefined));
        const clientIp = this.getClientIp(request);
        const apiKey = await this.authService.validateApiKey(apiKeyHeader, clientIp, sessionId);
        (0, request_context_1.setRequestActor)({ apiKeyId: apiKey.id, apiKeyName: apiKey.name, ipAddress: clientIp });
        if (requiredRole && !this.authService.hasPermission(apiKey, requiredRole)) {
            throw new common_1.ForbiddenException(`Insufficient permissions. Required: ${requiredRole}`);
        }
        if (this.chatScope.isRestricted(apiKey)) {
            const chatScoped = this.reflector.getAllAndOverride(auth_decorators_1.CHAT_SCOPED_KEY, [
                context.getHandler(),
                context.getClass(),
            ]);
            if (!chatScoped) {
                throw new common_1.ForbiddenException('API key is restricted to selected chats');
            }
            await this.assertChatsAllowed(request, apiKey, context);
        }
        const requireUnscoped = this.reflector.getAllAndOverride(auth_decorators_1.UNSCOPED_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (requireUnscoped && (apiKey.allowedSessions?.length ?? 0) > 0) {
            throw new common_1.ForbiddenException('Session-scoped API keys are not permitted on this route');
        }
        request.apiKey = apiKey;
        request.clientIp = clientIp;
        return true;
    }
    static CHAT_ROUTE_PARAMS = ['chatId', 'groupId', 'contactId'];
    static CHAT_BODY_FIELDS = ['chatId', 'fromChatId', 'toChatId'];
    static CHAT_BULK_MAX = bulk_message_dto_1.BULK_MESSAGES_MAX;
    chatIdsIn(request) {
        const out = [];
        for (const name of ApiKeyGuard_1.CHAT_ROUTE_PARAMS)
            out.push([name, request.params[name]]);
        out.push(['chatId', (request.query ?? {})['chatId']]);
        const body = request.body;
        if (body === null || typeof body !== 'object')
            return out;
        const b = body;
        for (const field of ApiKeyGuard_1.CHAT_BODY_FIELDS)
            out.push([field, b[field]]);
        const messages = b.messages;
        if (messages === undefined || messages === null)
            return out;
        if (!Array.isArray(messages))
            throw new common_1.BadRequestException('messages must be an array');
        if (messages.length > ApiKeyGuard_1.CHAT_BULK_MAX) {
            throw new common_1.BadRequestException(`messages must contain at most ${ApiKeyGuard_1.CHAT_BULK_MAX} entries`);
        }
        messages.forEach((item, i) => {
            if (item === null || typeof item !== 'object')
                return;
            out.push([`messages[${i}].chatId`, item.chatId]);
        });
        return out;
    }
    async assertChatsAllowed(request, apiKey, context) {
        const checked = new Set();
        for (const [field, value] of this.chatIdsIn(request)) {
            if (value === undefined || value === null)
                continue;
            if (typeof value !== 'string') {
                throw new common_1.BadRequestException(`${field} must be a single chat id string`);
            }
            if (value.length === 0 || checked.has(value))
                continue;
            checked.add(value);
            if (!(await this.chatScope.allows(apiKey, value))) {
                throw new common_1.ForbiddenException('API key not authorized for this chat');
            }
        }
        const quotedAllowed = this.reflector.getAllAndOverride(auth_decorators_1.CHAT_QUOTED_ALLOWED_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        const body = request.body;
        if (!quotedAllowed && body !== null && typeof body === 'object') {
            const quoted = body.quotedMessageId;
            if (quoted !== undefined && quoted !== null && quoted !== '') {
                throw new common_1.ForbiddenException('API key is restricted to selected chats');
            }
        }
    }
    extractApiKey(request) {
        return (0, bearer_token_1.presentedApiKey)(request.headers);
    }
    getClientIp(request) {
        const trustedProxies = this.configService.get('security.trustedProxies') ?? [];
        return (0, ip_1.resolveClientIp)(request, trustedProxies);
    }
};
exports.ApiKeyGuard = ApiKeyGuard;
exports.ApiKeyGuard = ApiKeyGuard = ApiKeyGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        core_1.Reflector,
        config_1.ConfigService,
        audit_service_1.AuditService,
        chat_scope_service_1.ChatScopeService])
], ApiKeyGuard);
//# sourceMappingURL=api-key.guard.js.map