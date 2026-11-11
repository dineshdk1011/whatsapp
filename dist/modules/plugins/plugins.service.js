"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginsService = void 0;
exports.isIngressCapable = isIngressCapable;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const plugins_1 = require("../../core/plugins");
const plugins_2 = require("../../core/plugins");
const redact_config_1 = require("./redact-config");
const plugin_activation_1 = require("../../core/plugins/plugin-activation");
const plugin_uninstaller_1 = require("../../core/plugins/plugin-uninstaller");
const plugin_installer_1 = require("./plugin-installer");
const plugin_download_1 = require("./plugin-download");
const catalog_1 = require("./catalog");
const ssrf_guard_1 = require("../../common/security/ssrf-guard");
const logger_service_1 = require("../../common/services/logger.service");
const CATALOG_MAX_BYTES = 1 * 1024 * 1024;
const logger = (0, logger_service_1.createLogger)('PluginsService');
function notApplied(error) {
    if (error instanceof plugins_1.PluginRegistryWriteError)
        return { success: false, message: error.message };
    throw error;
}
function isIngressCapable(manifest) {
    return (manifest.ingress?.length ?? 0) > 0 && (manifest.permissions ?? []).includes('webhook:ingress');
}
let PluginsService = class PluginsService {
    pluginLoader;
    configService;
    constructor(pluginLoader, configService) {
        this.pluginLoader = pluginLoader;
        this.configService = configService;
    }
    opChains = new Map();
    serialize(id, op) {
        if (this.pluginLoader.isRestorePending(id)) {
            return Promise.reject(new common_1.ConflictException(`Plugin ${id} is still being restored after startup. Retry in a moment.`));
        }
        const prior = this.opChains.get(id) ?? Promise.resolve();
        const next = prior.catch(() => undefined).then(op);
        this.opChains.set(id, next);
        void next
            .catch(() => undefined)
            .finally(() => {
            if (this.opChains.get(id) === next)
                this.opChains.delete(id);
        });
        return next;
    }
    findAll() {
        const plugins = this.pluginLoader.getAllPlugins();
        return plugins.map(plugin => ({
            id: plugin.manifest.id,
            name: plugin.manifest.name,
            version: plugin.manifest.version,
            type: plugin.manifest.type,
            description: plugin.manifest.description,
            author: plugin.manifest.author,
            status: plugin.status,
            config: (0, redact_config_1.redactSecretConfig)(plugin.config, plugin.manifest.configSchema),
            builtIn: this.pluginLoader.isBuiltIn(plugin.manifest.id),
            provides: plugin.manifest.provides ?? [],
            ingressCapable: isIngressCapable(plugin.manifest),
            configSchema: plugin.manifest.configSchema,
            configUi: plugin.manifest.configUi,
            i18n: plugin.manifest.i18n,
            sessionConfig: this.redactSessionConfig(plugin.sessionConfig, plugin.manifest.configSchema),
            sessionScoped: plugin.manifest.sessionScoped !== false,
            activeSessions: plugin.activeSessions ?? ['*'],
            loadedAt: plugin.loadedAt?.toISOString(),
            enabledAt: plugin.enabledAt?.toISOString(),
            error: plugin.error,
        }));
    }
    findOne(id) {
        const plugin = this.pluginLoader.getPlugin(id);
        if (!plugin) {
            throw new common_1.NotFoundException(`Plugin ${id} not found`);
        }
        return {
            id: plugin.manifest.id,
            name: plugin.manifest.name,
            version: plugin.manifest.version,
            type: plugin.manifest.type,
            description: plugin.manifest.description,
            author: plugin.manifest.author,
            status: plugin.status,
            config: (0, redact_config_1.redactSecretConfig)(plugin.config, plugin.manifest.configSchema),
            builtIn: this.pluginLoader.isBuiltIn(plugin.manifest.id),
            provides: plugin.manifest.provides ?? [],
            ingressCapable: isIngressCapable(plugin.manifest),
            configSchema: plugin.manifest.configSchema,
            configUi: plugin.manifest.configUi,
            i18n: plugin.manifest.i18n,
            sessionConfig: this.redactSessionConfig(plugin.sessionConfig, plugin.manifest.configSchema),
            sessionScoped: plugin.manifest.sessionScoped !== false,
            activeSessions: plugin.activeSessions ?? ['*'],
            loadedAt: plugin.loadedAt?.toISOString(),
            enabledAt: plugin.enabledAt?.toISOString(),
            error: plugin.error,
        };
    }
    enable(id) {
        return this.serialize(id, () => this.enableInner(id).catch(notApplied));
    }
    async enableInner(id) {
        const plugin = this.pluginLoader.getPlugin(id);
        if (!plugin) {
            throw new common_1.NotFoundException(`Plugin ${id} not found`);
        }
        if (plugin.status === plugins_1.PluginStatus.ENABLED) {
            this.pluginLoader.setOperatorEnabled(id, true);
            return { success: true, message: `Plugin ${id} is already enabled` };
        }
        try {
            await this.pluginLoader.enablePlugin(id);
            this.pluginLoader.setOperatorEnabled(id, true);
            return { success: true, message: `Plugin ${id} enabled successfully` };
        }
        catch (error) {
            if (error instanceof plugins_1.PluginRegistryWriteError)
                await this.pluginLoader.disablePlugin(id).catch(() => undefined);
            return {
                success: false,
                message: error instanceof Error ? error.message : String(error),
            };
        }
    }
    disable(id) {
        return this.serialize(id, () => this.disableInner(id).catch(notApplied));
    }
    async disableInner(id) {
        const plugin = this.pluginLoader.getPlugin(id);
        if (!plugin) {
            if (!this.pluginLoader.getRegistryEntry(id)) {
                throw new common_1.NotFoundException(`Plugin ${id} not found`);
            }
            this.pluginLoader.setOperatorEnabled(id, false);
            return { success: true, message: `Plugin ${id} is not loaded; it will not be enabled on boot` };
        }
        if (plugin.manifest.type === plugins_1.PluginType.ENGINE &&
            id === (this.configService.get('engine.type') ?? 'whatsapp-web.js')) {
            return {
                success: false,
                message: `Engine "${id}" cannot be disabled at runtime. Set engine.type and restart to switch engines.`,
            };
        }
        if (plugin.status !== plugins_1.PluginStatus.ENABLED) {
            this.pluginLoader.setOperatorEnabled(id, false);
            return { success: true, message: `Plugin ${id} is not enabled` };
        }
        this.pluginLoader.setOperatorEnabled(id, false);
        try {
            await this.pluginLoader.disablePlugin(id);
            return { success: true, message: `Plugin ${id} disabled successfully` };
        }
        catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : String(error),
            };
        }
    }
    updateSessions(id, sessions) {
        const plugin = this.pluginLoader.getPlugin(id);
        if (!plugin) {
            throw new common_1.NotFoundException(`Plugin ${id} not found`);
        }
        try {
            this.pluginLoader.setPluginSessions(id, sessions, { mustPersist: true });
        }
        catch (error) {
            if (error instanceof plugins_1.PluginRegistryWriteError)
                throw new common_1.InternalServerErrorException(error.message);
            if (error instanceof plugin_uninstaller_1.PluginUninstallingError)
                throw new common_1.ConflictException(error.message);
            throw new common_1.BadRequestException(error instanceof Error ? error.message : String(error));
        }
        return this.findOne(id);
    }
    updateConfig(id, config) {
        const plugin = this.pluginLoader.getPlugin(id);
        if (!plugin) {
            throw new common_1.NotFoundException(`Plugin ${id} not found`);
        }
        try {
            const stored = this.pluginLoader.getRegistryEntry(id)?.config ?? {};
            const merged = (0, redact_config_1.restoreSecretConfig)(config, stored, plugin.manifest.configSchema, { mergedOverStored: true });
            this.pluginLoader.updatePluginConfig(id, merged, { mustPersist: true });
            return { success: true, message: `Plugin ${id} configuration updated` };
        }
        catch (error) {
            if (error instanceof plugin_uninstaller_1.PluginUninstallingError)
                throw new common_1.ConflictException(error.message);
            return {
                success: false,
                message: error instanceof Error ? error.message : String(error),
            };
        }
    }
    updateSessionConfig(id, sessionId, config) {
        const plugin = this.pluginLoader.getPlugin(id);
        if (!plugin) {
            throw new common_1.NotFoundException(`Plugin ${id} not found`);
        }
        if (plugin.manifest.sessionScoped === false) {
            throw new common_1.BadRequestException(`Plugin ${id} is global (not session-scoped) and has no per-session config`);
        }
        try {
            const existing = plugin.sessionConfig?.[sessionId];
            const merged = (0, redact_config_1.restoreSecretConfig)(config, (0, plugin_activation_1.restorableConfig)(existing, config, plugin.manifest, plugin.config), plugin.manifest.configSchema);
            this.pluginLoader.setPluginSessionConfig(id, sessionId, merged, { mustPersist: true });
            return { success: true, message: `Plugin ${id} configuration for session ${sessionId} updated` };
        }
        catch (error) {
            if (error instanceof plugin_uninstaller_1.PluginUninstallingError)
                throw new common_1.ConflictException(error.message);
            return {
                success: false,
                message: error instanceof Error ? error.message : String(error),
            };
        }
    }
    redactSessionConfig(sessionConfig, schema) {
        if (!sessionConfig)
            return undefined;
        return Object.fromEntries(Object.entries(sessionConfig).map(([sid, cfg]) => [sid, (0, redact_config_1.redactSecretConfig)(cfg, schema)]));
    }
    getConfigUiHtml(id) {
        const plugin = this.pluginLoader.getPlugin(id);
        if (!plugin) {
            throw new common_1.NotFoundException(`Plugin ${id} not found`);
        }
        const entry = plugin.manifest.configUi?.entry;
        if (!entry || typeof entry !== 'string') {
            throw new common_1.NotFoundException(`Plugin ${id} has no config UI`);
        }
        const base = path.resolve(this.pluginLoader.getPluginPackageDir(id));
        let file;
        try {
            file = (0, plugins_1.resolvePluginEntryPath)(base, entry);
        }
        catch {
            throw new common_1.NotFoundException(`Config UI entry not found for plugin ${id}`);
        }
        if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
            throw new common_1.NotFoundException(`Config UI entry not found for plugin ${id}`);
        }
        const real = fs.realpathSync(file);
        const realBase = fs.realpathSync(base);
        if (real !== realBase && !real.startsWith(realBase + path.sep)) {
            throw new common_1.NotFoundException(`Config UI entry not found for plugin ${id}`);
        }
        return fs.readFileSync(real, 'utf-8');
    }
    install(file) {
        if (!file?.buffer?.length) {
            throw new common_1.BadRequestException('No plugin file uploaded');
        }
        const { manifest, entries } = (0, plugin_installer_1.parsePluginPackage)(file.buffer);
        if (this.pluginLoader.getPlugin(manifest.id)) {
            throw new common_1.ConflictException(`Plugin "${manifest.id}" is already installed`);
        }
        const pluginsDir = this.pluginLoader.getPluginsDir();
        const dir = path.join(pluginsDir, manifest.id);
        const dirExisted = fs.existsSync(dir);
        if (dirExisted) {
            if (!this.pluginLoader.getRegistryEntry(manifest.id)) {
                throw new common_1.ConflictException(`A plugin directory "${manifest.id}" already exists`);
            }
            if (fs.realpathSync(dir) !== path.join(fs.realpathSync(pluginsDir), manifest.id)) {
                throw new common_1.ConflictException(`A plugin directory "${manifest.id}" already exists`);
            }
            for (const entry of entries) {
                const dest = path.join(dir, entry.relPath);
                if (fs.existsSync(dest) && fs.statSync(dest).isDirectory()) {
                    throw new common_1.ConflictException(`Cannot install "${manifest.id}": "${entry.relPath}" is a directory`);
                }
            }
        }
        const written = [];
        try {
            for (const entry of entries) {
                const dest = path.join(dir, entry.relPath);
                fs.mkdirSync(path.dirname(dest), { recursive: true });
                fs.writeFileSync(dest, entry.data);
                written.push(dest);
            }
            this.pluginLoader.loadPlugin(dir);
        }
        catch (error) {
            if (dirExisted) {
                for (const dest of written)
                    fs.rmSync(dest, { force: true });
            }
            else {
                fs.rmSync(dir, { recursive: true, force: true });
            }
            if (error instanceof common_1.HttpException)
                throw error;
            throw new common_1.BadRequestException(`Failed to install plugin: ${error instanceof Error ? error.message : String(error)}`);
        }
        return this.findOne(manifest.id);
    }
    async installFromUrl(url) {
        return this.installPackage({ buffer: await this.downloadPackage(url) });
    }
    async installPackage(file) {
        if (!file?.buffer?.length) {
            throw new common_1.BadRequestException('No plugin file uploaded');
        }
        const { manifest } = (0, plugin_installer_1.parsePluginPackage)(file.buffer);
        return this.serialize(manifest.id, () => Promise.resolve(this.install(file)));
    }
    async downloadPackage(url) {
        try {
            (0, plugin_download_1.assertPluginInstallUrl)(url);
        }
        catch (error) {
            throw new common_1.BadRequestException(error instanceof Error ? error.message : String(error));
        }
        const maxBytes = this.configService.get('plugins.downloadMaxBytes') ?? 5 * 1024 * 1024;
        let buffer;
        try {
            buffer = await (0, plugin_download_1.fetchSafeBuffer)(url, { maxBytes });
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to download plugin from URL: ${(0, ssrf_guard_1.redactSsrfError)(error, logger, 'plugin download')}`);
        }
        try {
            (0, plugin_download_1.assertDownloadSha256)(url, buffer);
        }
        catch (error) {
            throw new common_1.BadRequestException(`Plugin download integrity check failed: ${error instanceof Error ? error.message : String(error)}`);
        }
        return buffer;
    }
    async getCatalog() {
        const url = this.configService.get('plugins.catalogUrl');
        if (!url)
            return [];
        let raw;
        try {
            raw = await (0, plugin_download_1.fetchSafeBuffer)(url, { maxBytes: CATALOG_MAX_BYTES });
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to fetch plugin catalog: ${(0, ssrf_guard_1.redactSsrfError)(error, logger, 'plugin catalog download')}`);
        }
        let entries;
        try {
            const parsed = JSON.parse(raw.toString('utf8'));
            if (!Array.isArray(parsed))
                throw new Error('catalog is not a JSON array');
            if (!parsed.every(catalog_1.isCatalogEntry)) {
                throw new Error('catalog entries must be JSON objects with a string id, name and version');
            }
            entries = parsed;
        }
        catch (error) {
            throw new common_1.BadRequestException(`Invalid plugin catalog JSON: ${error instanceof Error ? error.message : String(error)}`);
        }
        const installed = this.pluginLoader.getAllPlugins().map(p => ({ id: p.manifest.id, version: p.manifest.version }));
        return (0, catalog_1.annotateCatalog)(entries, installed);
    }
    updatePackage(id, buffer) {
        return this.serialize(id, () => this.updatePackageInner(id, buffer));
    }
    async updatePackageInner(id, buffer) {
        const plugin = this.pluginLoader.getPlugin(id);
        if (!plugin) {
            throw new common_1.NotFoundException(`Plugin ${id} not found`);
        }
        if (this.pluginLoader.isBuiltIn(id)) {
            throw new common_1.BadRequestException(`Cannot update built-in plugin ${id}`);
        }
        const { manifest, entries } = (0, plugin_installer_1.parsePluginPackage)(buffer);
        if (manifest.id !== id) {
            throw new common_1.BadRequestException(`Package id "${manifest.id}" does not match the plugin being updated ("${id}")`);
        }
        const wasEnabled = plugin.status === plugins_1.PluginStatus.ENABLED;
        const meantToRun = wasEnabled ||
            (plugin.status !== plugins_1.PluginStatus.ERROR && this.pluginLoader.getRegistryEntry(id)?.enabledByOperator === true);
        const refuseDuringShutdown = () => {
            if (meantToRun && this.pluginLoader.isShuttingDown()) {
                throw new common_1.ServiceUnavailableException(`Plugin ${id} was not updated: the gateway is shutting down`);
            }
        };
        refuseDuringShutdown();
        const dir = this.pluginLoader.getPluginPackageDir(id);
        const pluginsDir = path.dirname(dir);
        const backup = path.join(pluginsDir, (0, plugins_2.pluginUpdateBackupDirName)(id));
        const staging = path.join(pluginsDir, (0, plugins_2.pluginUpdateStagingDirName)(id));
        fs.rmSync(staging, { recursive: true, force: true });
        try {
            for (const entry of entries) {
                const dest = path.join(staging, entry.relPath);
                fs.mkdirSync(path.dirname(dest), { recursive: true });
                fs.writeFileSync(dest, entry.data);
            }
        }
        catch (error) {
            fs.rmSync(staging, { recursive: true, force: true });
            throw new common_1.BadRequestException(`Failed to stage plugin update: ${error instanceof Error ? error.message : String(error)}`);
        }
        logger.log(`Plugin update staged: ${id} → v${manifest.version}`, {
            pluginId: id,
            version: manifest.version,
            action: 'plugin_update_staged',
        });
        await this.pluginLoader.unloadPlugin(id);
        try {
            if (!fs.existsSync(dir) && fs.existsSync(backup)) {
                fs.renameSync(backup, dir);
                logger.warn(`Restored plugin ${id} from its update backup before applying a new update`, {
                    pluginId: id,
                    action: 'plugin_update_backup_restored',
                });
            }
            const packagePaths = new Set(entries.map(entry => entry.relPath));
            for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
                if (!entry.isFile() ||
                    !entry.name.endsWith('.json') ||
                    entry.name === 'manifest.json' ||
                    entry.name === 'package.json' ||
                    packagePaths.has(entry.name)) {
                    continue;
                }
                const stateFile = path.join(staging, entry.name);
                fs.copyFileSync(path.join(dir, entry.name), stateFile);
                fs.chmodSync(stateFile, 0o600);
            }
            fs.rmSync(backup, { recursive: true, force: true });
            fs.renameSync(dir, backup);
            fs.renameSync(staging, dir);
        }
        catch (error) {
            if (!fs.existsSync(dir) && fs.existsSync(backup)) {
                fs.renameSync(backup, dir);
            }
            fs.rmSync(staging, { recursive: true, force: true });
            try {
                this.pluginLoader.loadPlugin(dir);
                if (wasEnabled)
                    await this.pluginLoader.enablePlugin(id);
            }
            catch {
            }
            throw new common_1.BadRequestException(`Failed to update plugin: ${error instanceof Error ? error.message : String(error)}`);
        }
        logger.log(`Plugin update swapped in: ${id} → v${manifest.version}`, {
            pluginId: id,
            action: 'plugin_update_swapped',
        });
        try {
            this.pluginLoader.loadPlugin(dir);
            refuseDuringShutdown();
            if (wasEnabled)
                await this.pluginLoader.enablePlugin(id);
            fs.rmSync(backup, { recursive: true, force: true });
            logger.log(`Plugin updated: ${id} → v${manifest.version}`, {
                pluginId: id,
                version: manifest.version,
                action: 'plugin_update_applied',
            });
        }
        catch (error) {
            logger.warn(`Plugin update failed for ${id}; rolling back to the previous version`, {
                pluginId: id,
                action: 'plugin_update_rollback',
                error: error instanceof Error ? error.message : String(error),
            });
            await this.pluginLoader.unloadPlugin(id).catch(() => undefined);
            fs.rmSync(dir, { recursive: true, force: true });
            fs.renameSync(backup, dir);
            try {
                this.pluginLoader.loadPlugin(dir);
                if (wasEnabled)
                    await this.pluginLoader.enablePlugin(id);
            }
            catch {
            }
            if (error instanceof common_1.HttpException)
                throw error;
            throw new common_1.BadRequestException(`Failed to update plugin: ${error instanceof Error ? error.message : String(error)}`);
        }
        return this.findOne(id);
    }
    async updateFromUrl(id, url) {
        const buffer = await this.downloadPackage(url);
        return this.updatePackage(id, buffer);
    }
    uninstall(id) {
        return this.serialize(id, () => this.uninstallInner(id));
    }
    async uninstallInner(id) {
        if (!this.pluginLoader.getPlugin(id) && !this.pluginLoader.getRegistryEntry(id)) {
            throw new common_1.NotFoundException(`Plugin ${id} not found`);
        }
        try {
            const { registryEntryKept } = await this.pluginLoader.uninstallPlugin(id);
            if (registryEntryKept) {
                return {
                    success: true,
                    message: `Plugin ${id} uninstalled, but the plugin registry could not be written: registry.json keeps its entry, ` +
                        'emptied of config, sessions and the enable decision, reported at startup as a plugin with no code ' +
                        `until DELETE /api/plugins/${id} is repeated once the registry is writable`,
                };
            }
            return { success: true, message: `Plugin ${id} uninstalled successfully` };
        }
        catch (error) {
            if (error instanceof plugins_1.PluginRegistryWriteError)
                throw new common_1.InternalServerErrorException(error.message);
            throw new common_1.BadRequestException(error instanceof Error ? error.message : String(error), {
                cause: error,
                description: 'Bad Request',
            });
        }
    }
    async healthCheck(id) {
        const plugin = this.pluginLoader.getPlugin(id);
        if (!plugin) {
            throw new common_1.NotFoundException(`Plugin ${id} not found`);
        }
        try {
            return await this.pluginLoader.checkPluginHealth(id);
        }
        catch (error) {
            return {
                healthy: false,
                message: error instanceof Error ? error.message : String(error),
            };
        }
    }
};
exports.PluginsService = PluginsService;
exports.PluginsService = PluginsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [plugins_1.PluginLoaderService,
        config_1.ConfigService])
], PluginsService);
//# sourceMappingURL=plugins.service.js.map