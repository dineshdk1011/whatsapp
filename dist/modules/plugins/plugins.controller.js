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
var PluginsController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const plugins_service_1 = require("./plugins.service");
const plugin_dto_1 = require("./dto/plugin.dto");
const auth_decorators_1 = require("../auth/decorators/auth.decorators");
const api_key_entity_1 = require("../auth/entities/api-key.entity");
const audit_service_1 = require("../audit/audit.service");
const audit_log_entity_1 = require("../audit/entities/audit-log.entity");
const plugin_uninstaller_1 = require("../../core/plugins/plugin-uninstaller");
const MAX_PLUGIN_UPLOAD_BYTES = 5 * 1024 * 1024;
const RESTORING_CONFLICT = 'The plugin is still being restored after startup; retry shortly';
const UNINSTALLING_CONFLICT = 'The plugin is being uninstalled; nothing was changed';
let PluginsController = PluginsController_1 = class PluginsController {
    pluginsService;
    audit;
    constructor(pluginsService, audit) {
        this.pluginsService = pluginsService;
        this.audit = audit;
    }
    record(action, pluginId, extra = {}, sessionId) {
        void this.audit.logInfo(action, { sessionId, metadata: { pluginId, ...extra } });
    }
    static sourceHost(url) {
        try {
            return new URL(url).host;
        }
        catch {
            return 'unknown';
        }
    }
    findAll() {
        return this.pluginsService.findAll();
    }
    async install(file) {
        const plugin = await this.pluginsService.installPackage(file);
        this.record(audit_log_entity_1.AuditAction.PLUGIN_INSTALLED, plugin.id, { version: plugin.version, source: 'upload' });
        return plugin;
    }
    async installFromUrl(dto) {
        const plugin = await this.pluginsService.installFromUrl(dto.url);
        this.record(audit_log_entity_1.AuditAction.PLUGIN_INSTALLED, plugin.id, {
            version: plugin.version,
            source: PluginsController_1.sourceHost(dto.url),
        });
        return plugin;
    }
    async catalog() {
        return await this.pluginsService.getCatalog();
    }
    findOne(id) {
        return this.pluginsService.findOne(id);
    }
    async enable(id) {
        const result = await this.pluginsService.enable(id);
        if (result.success)
            this.record(audit_log_entity_1.AuditAction.PLUGIN_ENABLED, id);
        return result;
    }
    async disable(id) {
        const result = await this.pluginsService.disable(id);
        if (result.success)
            this.record(audit_log_entity_1.AuditAction.PLUGIN_DISABLED, id);
        return result;
    }
    updateConfig(id, configDto) {
        const result = this.pluginsService.updateConfig(id, configDto.config);
        if (result.success)
            this.record(audit_log_entity_1.AuditAction.PLUGIN_CONFIG_UPDATED, id, { fields: Object.keys(configDto.config ?? {}) });
        return result;
    }
    getConfigUi(id) {
        return this.pluginsService.getConfigUiHtml(id);
    }
    updateSessionConfig(id, sessionId, configDto) {
        const result = this.pluginsService.updateSessionConfig(id, sessionId, configDto.config);
        if (result.success) {
            this.record(audit_log_entity_1.AuditAction.PLUGIN_CONFIG_UPDATED, id, { fields: Object.keys(configDto.config ?? {}) }, sessionId);
        }
        return result;
    }
    updateSessions(id, dto) {
        const plugin = this.pluginsService.updateSessions(id, dto.sessions);
        this.record(audit_log_entity_1.AuditAction.PLUGIN_SESSIONS_UPDATED, id, { sessions: dto.sessions });
        return plugin;
    }
    async update(id, dto) {
        const plugin = await this.pluginsService.updateFromUrl(id, dto.url);
        this.record(audit_log_entity_1.AuditAction.PLUGIN_UPDATED, id, {
            version: plugin.version,
            source: PluginsController_1.sourceHost(dto.url),
        });
        return plugin;
    }
    async uninstall(id) {
        const result = await this.pluginsService.uninstall(id).catch((error) => {
            if (error instanceof common_1.HttpException && error.cause instanceof plugin_uninstaller_1.PluginUninstallIncompleteError) {
                this.record(audit_log_entity_1.AuditAction.PLUGIN_UNINSTALLED, id, { partial: true, error: error.message });
            }
            throw error;
        });
        this.record(audit_log_entity_1.AuditAction.PLUGIN_UNINSTALLED, id);
        return result;
    }
    async healthCheck(id) {
        return await this.pluginsService.healthCheck(id);
    }
};
exports.PluginsController = PluginsController;
__decorate([
    (0, common_1.Get)(),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.ADMIN),
    (0, auth_decorators_1.RequireUnscopedKey)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all plugins' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of all plugins', type: plugin_dto_1.PluginDto, isArray: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Array)
], PluginsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)('install'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.ADMIN),
    (0, auth_decorators_1.RequireUnscopedKey)(),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', { limits: { fileSize: MAX_PLUGIN_UPLOAD_BYTES } })),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        required: true,
        schema: {
            type: 'object',
            required: ['file'],
            properties: { file: { type: 'string', format: 'binary', description: 'The plugin .zip package' } },
        },
    }),
    (0, swagger_1.ApiOperation)({ summary: 'Install a plugin from an uploaded .zip package' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Plugin installed', type: plugin_dto_1.PluginDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid package' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Plugin already installed' }),
    (0, swagger_1.ApiResponse)({ status: 413, description: 'Package exceeds the 5 MB upload limit' }),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PluginsController.prototype, "install", null);
__decorate([
    (0, common_1.Post)('install-url'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.ADMIN),
    (0, auth_decorators_1.RequireUnscopedKey)(),
    (0, swagger_1.ApiOperation)({ summary: 'Install a plugin by downloading its .zip from a URL (SSRF-guarded)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Plugin installed', type: plugin_dto_1.PluginDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid URL, download failed, or invalid package' }),
    (0, swagger_1.ApiResponse)({
        status: 409,
        description: 'Plugin already installed, or the plugin is still being restored after startup; retry shortly',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [plugin_dto_1.InstallFromUrlDto]),
    __metadata("design:returntype", Promise)
], PluginsController.prototype, "installFromUrl", null);
__decorate([
    (0, common_1.Get)('catalog'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.ADMIN),
    (0, auth_decorators_1.RequireUnscopedKey)(),
    (0, swagger_1.ApiOperation)({ summary: 'List the remote plugin catalog, annotated with install state' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Catalog entries', type: [plugin_dto_1.PluginCatalogEntryDto] }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Catalog could not be fetched or parsed' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PluginsController.prototype, "catalog", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.ADMIN),
    (0, auth_decorators_1.RequireUnscopedKey)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get plugin by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Plugin details', type: plugin_dto_1.PluginDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Plugin not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", plugin_dto_1.PluginDto)
], PluginsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':id/enable'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.ADMIN),
    (0, auth_decorators_1.RequireUnscopedKey)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Enable a plugin' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Plugin enabled successfully', type: plugin_dto_1.PluginActionResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Plugin not found' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: RESTORING_CONFLICT }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PluginsController.prototype, "enable", null);
__decorate([
    (0, common_1.Post)(':id/disable'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.ADMIN),
    (0, auth_decorators_1.RequireUnscopedKey)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Disable a plugin' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Plugin disabled successfully', type: plugin_dto_1.PluginActionResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Plugin not found' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: RESTORING_CONFLICT }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PluginsController.prototype, "disable", null);
__decorate([
    (0, common_1.Put)(':id/config'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.ADMIN),
    (0, auth_decorators_1.RequireUnscopedKey)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update plugin configuration' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Plugin configuration updated', type: plugin_dto_1.PluginActionResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation failed, or the body carries a field the DTO does not declare.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Plugin not found' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: UNINSTALLING_CONFLICT }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, plugin_dto_1.PluginConfigDto]),
    __metadata("design:returntype", Object)
], PluginsController.prototype, "updateConfig", null);
__decorate([
    (0, common_1.Get)(':id/config-ui'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.ADMIN),
    (0, auth_decorators_1.RequireUnscopedKey)(),
    (0, common_1.Header)('Content-Type', 'text/html; charset=utf-8'),
    (0, common_1.Header)('Content-Security-Policy', 'sandbox'),
    (0, common_1.Header)('X-Content-Type-Options', 'nosniff'),
    (0, swagger_1.ApiOperation)({ summary: "Serve a plugin's sandboxed config-UI entry HTML (for an iframe srcdoc)" }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Config UI HTML',
        content: { 'text/html': { schema: { type: 'string' } } },
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Plugin not found or has no config UI' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", String)
], PluginsController.prototype, "getConfigUi", null);
__decorate([
    (0, common_1.Put)(':id/config/:sessionId'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Set a plugin config override for a specific session (empty = clear it)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Per-session plugin configuration updated', type: plugin_dto_1.PluginActionResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Plugin is global (not session-scoped), or the body failed validation' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Plugin not found' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: UNINSTALLING_CONFLICT }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('sessionId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, plugin_dto_1.PluginConfigDto]),
    __metadata("design:returntype", Object)
], PluginsController.prototype, "updateSessionConfig", null);
__decorate([
    (0, common_1.Put)(':id/sessions'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.ADMIN),
    (0, auth_decorators_1.RequireUnscopedKey)(),
    (0, swagger_1.ApiOperation)({ summary: "Set which sessions a session-scoped plugin is activated for (['*'] = all)" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Plugin session activation updated', type: plugin_dto_1.PluginDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Plugin is global (not session-scoped), or the body failed validation' }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'A session-restricted key may not replace the full active set — full activation replacement requires an unrestricted key',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Plugin not found' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: UNINSTALLING_CONFLICT }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'The plugin registry could not be written; nothing was changed' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, plugin_dto_1.PluginSessionsDto]),
    __metadata("design:returntype", plugin_dto_1.PluginDto)
], PluginsController.prototype, "updateSessions", null);
__decorate([
    (0, common_1.Post)(':id/update'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.ADMIN),
    (0, auth_decorators_1.RequireUnscopedKey)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update an installed plugin in place from a URL (preserves config + enabled state)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Plugin updated', type: plugin_dto_1.PluginDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid URL/package, id mismatch, or built-in' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Plugin not found' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: RESTORING_CONFLICT }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'Gateway shutting down; the previous version was kept',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, plugin_dto_1.InstallFromUrlDto]),
    __metadata("design:returntype", Promise)
], PluginsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.ADMIN),
    (0, auth_decorators_1.RequireUnscopedKey)(),
    (0, swagger_1.ApiOperation)({ summary: 'Uninstall a plugin (removes its files; built-ins are protected)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Plugin uninstalled', type: plugin_dto_1.PluginActionResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Cannot uninstall (e.g. built-in)' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Plugin not found' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: RESTORING_CONFLICT }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'The plugin registry could not be written; nothing was removed' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PluginsController.prototype, "uninstall", null);
__decorate([
    (0, common_1.Get)(':id/health'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.ADMIN),
    (0, auth_decorators_1.RequireUnscopedKey)(),
    (0, swagger_1.ApiOperation)({ summary: 'Check plugin health' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Plugin health status', type: plugin_dto_1.PluginHealthResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Plugin not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PluginsController.prototype, "healthCheck", null);
exports.PluginsController = PluginsController = PluginsController_1 = __decorate([
    (0, swagger_1.ApiTags)('plugins'),
    (0, common_1.Controller)('plugins'),
    __metadata("design:paramtypes", [plugins_service_1.PluginsService,
        audit_service_1.AuditService])
], PluginsController);
//# sourceMappingURL=plugins.controller.js.map