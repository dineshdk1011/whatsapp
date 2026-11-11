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
exports.IntegrationInstanceController = void 0;
const common_1 = require("@nestjs/common");
const auth_decorators_1 = require("../auth/decorators/auth.decorators");
const api_key_entity_1 = require("../auth/entities/api-key.entity");
const audit_log_entity_1 = require("../audit/entities/audit-log.entity");
const audit_service_1 = require("../audit/audit.service");
const plugin_loader_service_1 = require("../../core/plugins/plugin-loader.service");
const plugin_activation_1 = require("../../core/plugins/plugin-activation");
const plugin_instance_service_1 = require("./plugin-instance.service");
const scope_binding_service_1 = require("./scope-binding.service");
const ingress_url_1 = require("./ingress-url");
const instance_dto_1 = require("./dto/instance.dto");
const session_scope_1 = require("../../common/security/session-scope");
const swagger_1 = require("@nestjs/swagger");
const isScopedKey = (apiKey) => (apiKey?.allowedSessions?.length ?? 0) > 0;
const contributedConfig = (inst) => inst.enabled && (0, plugin_activation_1.isAllSessionsScope)(inst.sessionScope) ? (inst.config ?? undefined) : undefined;
let IntegrationInstanceController = class IntegrationInstanceController {
    instances;
    loader;
    audit;
    scopeBinding;
    constructor(instances, loader, audit, scopeBinding) {
        this.instances = instances;
        this.loader = loader;
        this.audit = audit;
        this.scopeBinding = scopeBinding;
    }
    async create(pluginId, dto, apiKey) {
        const routes = this.assertIngressCapable(pluginId);
        this.assertScopeWritable(apiKey, dto.sessionScope);
        try {
            const inst = await this.instances.create(pluginId, dto.instanceId, {
                sessionScope: dto.sessionScope,
                verifyToken: dto.verifyToken,
                secret: dto.secret,
                config: dto.config,
            });
            void this.audit.logInfo(audit_log_entity_1.AuditAction.INTEGRATION_INSTANCE_CREATED, {
                metadata: { pluginId, instanceId: dto.instanceId },
            });
            await this.scopeBinding.applyScopeBinding(pluginId, inst.sessionScope, inst.config ?? {}, inst.enabled, {
                additive: isScopedKey(apiKey),
            });
            return this.view(inst, routes, true);
        }
        catch (err) {
            if (err instanceof plugin_instance_service_1.InstanceExistsError)
                throw new common_1.ConflictException(err.message);
            throw err;
        }
    }
    async list(pluginId, apiKey) {
        const routes = this.pluginRoutes(pluginId);
        const rows = await this.instances.list(pluginId);
        return rows
            .filter(r => (0, session_scope_1.sessionScopeVisible)(apiKey?.allowedSessions, r.sessionScope))
            .map(r => this.view(r, routes, false));
    }
    async getOne(pluginId, instanceId, apiKey) {
        const inst = await this.resolveVisible(pluginId, instanceId, apiKey);
        return this.view(inst, this.pluginRoutes(pluginId), false);
    }
    async regenerate(pluginId, instanceId, apiKey) {
        await this.resolveVisible(pluginId, instanceId, apiKey);
        const inst = await this.instances.regenerateSecret(pluginId, instanceId);
        if (!inst)
            throw new common_1.NotFoundException('instance not found');
        void this.audit.logInfo(audit_log_entity_1.AuditAction.INTEGRATION_INSTANCE_SECRET_REGENERATED, {
            metadata: { pluginId, instanceId },
        });
        return this.view(inst, this.pluginRoutes(pluginId), true);
    }
    async patch(pluginId, instanceId, dto, apiKey) {
        let inst = await this.resolveVisible(pluginId, instanceId, apiKey);
        if (dto.sessionScope !== undefined)
            this.assertScopeWritable(apiKey, dto.sessionScope);
        const previousScope = inst.sessionScope;
        const previousConfig = contributedConfig(inst);
        if (dto.enabled !== undefined || dto.sessionScope !== undefined || dto.config !== undefined) {
            const plugin = this.loader.getPlugin(pluginId);
            if (dto.config && !plugin) {
                throw new common_1.ConflictException(`Plugin ${pluginId} is not loaded, so its instance config cannot be changed`);
            }
            inst = await this.instances.update(pluginId, instanceId, { enabled: dto.enabled, sessionScope: dto.sessionScope, config: dto.config }, this.schemaFor(pluginId), { net: plugin?.manifest.net, beneath: plugin?.config });
            if (!inst)
                throw new common_1.NotFoundException('instance not found');
        }
        const updated = inst;
        if (previousScope !== updated.sessionScope) {
            await this.scopeBinding.applyScopeBinding(pluginId, previousScope, {}, false, {
                previousConfig: (0, plugin_activation_1.isAllSessionsScope)(updated.sessionScope) ? undefined : previousConfig,
                additive: isScopedKey(apiKey),
            });
        }
        await this.scopeBinding.applyScopeBinding(pluginId, updated.sessionScope, updated.config ?? {}, updated.enabled, {
            previousConfig,
            additive: isScopedKey(apiKey),
        });
        const updatedFields = ['enabled', 'sessionScope', 'config'].filter(f => dto[f] !== undefined);
        void this.audit.logInfo(audit_log_entity_1.AuditAction.INTEGRATION_INSTANCE_UPDATED, {
            metadata: { pluginId, instanceId, updated: updatedFields },
        });
        return this.view(updated, this.pluginRoutes(pluginId), false);
    }
    async remove(pluginId, instanceId, apiKey) {
        const inst = await this.resolveVisible(pluginId, instanceId, apiKey);
        const scope = inst.sessionScope;
        await this.instances.remove(pluginId, instanceId);
        await this.scopeBinding.applyScopeBinding(pluginId, scope, {}, false, {
            previousConfig: contributedConfig(inst),
            additive: isScopedKey(apiKey),
        });
        void this.audit.logInfo(audit_log_entity_1.AuditAction.INTEGRATION_INSTANCE_DELETED, { metadata: { pluginId, instanceId } });
    }
    async resolveVisible(pluginId, instanceId, apiKey) {
        const inst = await this.instances.resolve(pluginId, instanceId);
        if (!inst || !(0, session_scope_1.sessionScopeVisible)(apiKey?.allowedSessions, inst.sessionScope)) {
            throw new common_1.NotFoundException('instance not found');
        }
        return inst;
    }
    assertScopeWritable(apiKey, sessionScope) {
        if (!(0, session_scope_1.sessionScopeVisible)(apiKey?.allowedSessions, sessionScope)) {
            throw new common_1.ForbiddenException("sessionScope is outside the API key's allowed sessions");
        }
    }
    assertIngressCapable(pluginId) {
        const plugin = this.loader.getPlugin(pluginId);
        if (!plugin)
            throw new common_1.NotFoundException(`plugin ${pluginId} not found`);
        const routes = plugin.manifest.ingress?.map(r => r.route) ?? [];
        const hasPerm = (plugin.manifest.permissions ?? []).includes('webhook:ingress');
        if (routes.length === 0 || !hasPerm) {
            throw new common_1.BadRequestException(`plugin ${pluginId} is not ingress-capable`);
        }
        return routes;
    }
    pluginRoutes(pluginId) {
        return this.loader.getPlugin(pluginId)?.manifest.ingress?.map(r => r.route) ?? [];
    }
    schemaFor(pluginId) {
        return this.loader.getPlugin(pluginId)?.manifest.configSchema;
    }
    view(inst, routes, reveal) {
        const schema = this.loader.getPlugin(inst.pluginId)?.manifest.configSchema;
        const masked = this.instances.maskedView(inst, schema);
        return {
            id: masked.id,
            pluginId: masked.pluginId,
            instanceId: masked.instanceId,
            sessionScope: masked.sessionScope,
            secret: reveal ? inst.secret : masked.secret,
            verifyToken: reveal ? inst.verifyToken : inst.verifyToken ? '***' : null,
            config: masked.config,
            enabled: masked.enabled,
            createdAt: masked.createdAt,
            updatedAt: masked.updatedAt,
            ingressUrls: (0, ingress_url_1.buildIngressUrls)(process.env.BASE_URL, inst.pluginId, inst.instanceId, routes),
        };
    }
};
exports.IntegrationInstanceController = IntegrationInstanceController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(201),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Instance created. The plaintext ingress secret and verifyToken are revealed once in this response — store them immediately (both masked on every later read).',
        type: instance_dto_1.InstanceView,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation failed, or the plugin is not ingress-capable.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: "sessionScope is outside the key's allowedSessions." }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Plugin not found.' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'An instance with that id already exists for the plugin' }),
    __param(0, (0, common_1.Param)('pluginId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, auth_decorators_1.CurrentApiKey)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, instance_dto_1.CreateInstanceDto, Function]),
    __metadata("design:returntype", Promise)
], IntegrationInstanceController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Instances for the plugin (secrets masked).', type: [instance_dto_1.InstanceView] }),
    __param(0, (0, common_1.Param)('pluginId')),
    __param(1, (0, auth_decorators_1.CurrentApiKey)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Function]),
    __metadata("design:returntype", Promise)
], IntegrationInstanceController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':instanceId'),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'The instance (secret masked).', type: instance_dto_1.InstanceView }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "Unknown instance, or one outside the key's allowedSessions." }),
    __param(0, (0, common_1.Param)('pluginId')),
    __param(1, (0, common_1.Param)('instanceId')),
    __param(2, (0, auth_decorators_1.CurrentApiKey)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Function]),
    __metadata("design:returntype", Promise)
], IntegrationInstanceController.prototype, "getOne", null);
__decorate([
    (0, common_1.Post)(':instanceId/regenerate-secret'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Secret regenerated. The new plaintext secret is revealed once in this response; the verifyToken is also shown (unchanged).',
        type: instance_dto_1.InstanceView,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "Unknown instance, or one outside the key's allowedSessions." }),
    __param(0, (0, common_1.Param)('pluginId')),
    __param(1, (0, common_1.Param)('instanceId')),
    __param(2, (0, auth_decorators_1.CurrentApiKey)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Function]),
    __metadata("design:returntype", Promise)
], IntegrationInstanceController.prototype, "regenerate", null);
__decorate([
    (0, common_1.Patch)(':instanceId'),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Instance updated (secret masked).', type: instance_dto_1.InstanceView }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation failed, or the masked config could not be restored.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: "The new sessionScope is outside the key's allowedSessions." }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "Unknown instance, or one outside the key's allowedSessions." }),
    (0, swagger_1.ApiResponse)({
        status: 409,
        description: 'The body changes config while the plugin is not loaded. Nothing is written; a body without config still ' +
            'applies enabled and sessionScope.',
    }),
    __param(0, (0, common_1.Param)('pluginId')),
    __param(1, (0, common_1.Param)('instanceId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, auth_decorators_1.CurrentApiKey)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, instance_dto_1.UpdateInstanceDto, Function]),
    __metadata("design:returntype", Promise)
], IntegrationInstanceController.prototype, "patch", null);
__decorate([
    (0, common_1.Delete)(':instanceId'),
    (0, common_1.HttpCode)(204),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Instance deleted and its session scope torn down.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "Unknown instance, or one outside the key's allowedSessions." }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'On SQLite, another database transaction stayed open for 10 s; nothing was deleted, so retry.',
    }),
    __param(0, (0, common_1.Param)('pluginId')),
    __param(1, (0, common_1.Param)('instanceId')),
    __param(2, (0, auth_decorators_1.CurrentApiKey)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Function]),
    __metadata("design:returntype", Promise)
], IntegrationInstanceController.prototype, "remove", null);
exports.IntegrationInstanceController = IntegrationInstanceController = __decorate([
    (0, swagger_1.ApiTags)('integration'),
    (0, common_1.Controller)('integration/plugins/:pluginId/instances'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.ADMIN),
    __metadata("design:paramtypes", [plugin_instance_service_1.PluginInstanceService,
        plugin_loader_service_1.PluginLoaderService,
        audit_service_1.AuditService,
        scope_binding_service_1.ScopeBindingService])
], IntegrationInstanceController);
//# sourceMappingURL=integration-instance.controller.js.map