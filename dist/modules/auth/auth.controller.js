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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_service_1 = require("./auth.service");
const dto_1 = require("./dto");
const auth_decorators_1 = require("./decorators/auth.decorators");
const api_key_entity_1 = require("./entities/api-key.entity");
const audit_service_1 = require("../audit/audit.service");
const audit_log_entity_1 = require("./../audit/entities/audit-log.entity");
function readableExpiry(expiresAt) {
    return expiresAt && Number.isNaN(expiresAt.getTime()) ? new Date(0) : expiresAt;
}
let AuthController = class AuthController {
    authService;
    auditService;
    constructor(authService, auditService) {
        this.authService = authService;
        this.auditService = auditService;
    }
    auditContext(req, actor) {
        return {
            apiKey: actor,
            ipAddress: req.clientIp ?? undefined,
            method: req.method,
            path: req.path,
        };
    }
    authzSnapshot(key) {
        return {
            role: key.role,
            allowedIps: key.allowedIps,
            allowedSessions: key.allowedSessions,
            allowedChats: key.allowedChats,
            expiresAt: readableExpiry(key.expiresAt),
        };
    }
    toResponse(k) {
        return {
            id: k.id,
            name: k.name,
            keyPrefix: k.keyPrefix,
            role: k.role,
            allowedIps: k.allowedIps || undefined,
            allowedSessions: k.allowedSessions || undefined,
            allowedChats: k.allowedChats || undefined,
            isActive: k.isActive,
            expiresAt: readableExpiry(k.expiresAt) || undefined,
            lastUsedAt: k.lastUsedAt || undefined,
            usageCount: k.usageCount,
            createdAt: k.createdAt,
        };
    }
    async create(dto, req, actor) {
        const { apiKey, rawKey } = await this.authService.createApiKey(dto);
        await this.auditService.logInfo(audit_log_entity_1.AuditAction.API_KEY_CREATED, {
            ...this.auditContext(req, actor),
            metadata: {
                targetKeyId: apiKey.id,
                targetKeyName: apiKey.name,
                role: apiKey.role,
                scope: this.authzSnapshot(apiKey),
            },
        });
        return { ...this.toResponse(apiKey), apiKey: rawKey };
    }
    async findAll() {
        const keys = await this.authService.findAll();
        return keys.map(k => this.toResponse(k));
    }
    async findOne(id) {
        const k = await this.authService.findOne(id);
        return this.toResponse(k);
    }
    async update(id, dto, req, actor) {
        const before = await this.authService.findOne(id);
        const k = await this.authService.update(id, dto);
        await this.auditService.logInfo(audit_log_entity_1.AuditAction.API_KEY_UPDATED, {
            ...this.auditContext(req, actor),
            metadata: {
                targetKeyId: k.id,
                targetKeyName: k.name,
                before: this.authzSnapshot(before),
                after: this.authzSnapshot(k),
            },
        });
        return this.toResponse(k);
    }
    async delete(id, req, actor) {
        const target = await this.authService.findOne(id);
        await this.authService.delete(id);
        await this.auditService.logInfo(audit_log_entity_1.AuditAction.API_KEY_DELETED, {
            ...this.auditContext(req, actor),
            metadata: { targetKeyId: id, targetKeyName: target?.name },
        });
    }
    async revoke(id, req, actor) {
        const k = await this.authService.revoke(id);
        await this.auditService.logInfo(audit_log_entity_1.AuditAction.API_KEY_REVOKED, {
            ...this.auditContext(req, actor),
            metadata: { targetKeyId: k.id, targetKeyName: k.name },
        });
        return this.toResponse(k);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)(),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new API key (admin only)' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'API key created',
        type: dto_1.ApiKeyCreatedResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation failed, or the body carries a field the DTO does not declare.' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, auth_decorators_1.CurrentApiKey)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateApiKeyDto, Object, Function]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'List all API keys (admin only)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'All API keys (the plaintext key is never returned; only the keyPrefix).',
        type: [dto_1.ApiKeyResponseDto],
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get API key details (admin only)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'The API key (plaintext never returned; only the keyPrefix).',
        type: dto_1.ApiKeyResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'No API key with this id.' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Update API key (admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'The updated API key.', type: dto_1.ApiKeyResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation failed, or the body carries a field the DTO does not declare.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'No API key with this id.' }),
    (0, swagger_1.ApiResponse)({
        status: 409,
        description: 'The change would remove the last usable admin key: no other usable admin key lasts at least as long.',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, auth_decorators_1.CurrentApiKey)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateApiKeyDto, Object, Function]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.ADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete API key (admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'API key deleted' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'No API key with this id.' }),
    (0, swagger_1.ApiResponse)({
        status: 409,
        description: 'The key is the last usable admin key: no other usable admin key lasts at least as long.',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, auth_decorators_1.CurrentApiKey)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Function]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)(':id/revoke'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.ADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Revoke API key (admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'The revoked API key (isActive now false).', type: dto_1.ApiKeyResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'No API key with this id.' }),
    (0, swagger_1.ApiResponse)({
        status: 409,
        description: 'The key is the last usable admin key: no other usable admin key lasts at least as long.',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, auth_decorators_1.CurrentApiKey)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Function]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "revoke", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('auth'),
    (0, common_1.Controller)('auth/api-keys'),
    (0, auth_decorators_1.RequireUnscopedKey)(),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        audit_service_1.AuditService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map