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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginPackageScanner = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const plugin_interfaces_1 = require("./plugin.interfaces");
const plugin_manifest_1 = require("./plugin-manifest");
const config_defaults_util_1 = require("./config-defaults.util");
const plugin_paths_1 = require("./plugin-paths");
const LEGACY_REMOVED_PLUGIN_IDS = new Set(['auto-reply', 'translation']);
function hasPluginPackages(dir) {
    try {
        return fs
            .readdirSync(dir, { withFileTypes: true })
            .some(entry => entry.isDirectory() &&
            !entry.name.startsWith('.') &&
            fs.existsSync(path.join(dir, entry.name, 'manifest.json')));
    }
    catch {
        return false;
    }
}
class PluginPackageScanner {
    logger;
    configService;
    pluginStorage;
    pluginsDir;
    legacyPluginsDir;
    plugins;
    constructor(logger, configService, pluginStorage, pluginsDir, legacyPluginsDir, plugins) {
        this.logger = logger;
        this.configService = configService;
        this.pluginStorage = pluginStorage;
        this.pluginsDir = pluginsDir;
        this.legacyPluginsDir = legacyPluginsDir;
        this.plugins = plugins;
    }
    scanAtBoot() {
        const failedLoads = new Set();
        if (fs.existsSync(this.pluginsDir)) {
            this.loadPluginsFromDirectory(this.pluginsDir, failedLoads);
        }
        if (this.legacyPluginsDir && hasPluginPackages(this.legacyPluginsDir)) {
            this.logger.warn(`Loading plugins from the legacy directory ${this.legacyPluginsDir}: the default moved to ` +
                `${this.pluginsDir}, where the plugin registry and every new install already are. Move them ` +
                `(mv ${this.legacyPluginsDir}/* ${this.pluginsDir}/) or keep the old location by setting ` +
                `PLUGINS_DIR=${this.legacyPluginsDir}. In Docker this matters: a directory outside the data ` +
                `volume is destroyed on the next container recreate.`, { action: 'plugins_legacy_dir', legacyDir: this.legacyPluginsDir, pluginsDir: this.pluginsDir });
            this.loadPluginsFromDirectory(this.legacyPluginsDir, failedLoads);
        }
        this.logger.log(`Loaded ${this.plugins.size} plugins`, {
            action: 'plugins_loaded',
            count: this.plugins.size,
        });
        this.warnOnRegistryEntriesWithoutCode(failedLoads);
    }
    warnOnRegistryEntriesWithoutCode(failedLoads) {
        const orphaned = this.pluginStorage
            .getAllEntries()
            .filter(e => !e.builtIn && !this.plugins.has(e.id) && !failedLoads.has(e.id));
        if (orphaned.length === 0)
            return;
        const missingDir = fs.existsSync(this.pluginsDir) ? '' : ' (that directory does not exist)';
        this.logger.warn(`The plugin registry lists ${orphaned.length} installed plugin(s) with no loaded code in ` +
            `${this.pluginsDir}${missingDir}: ${orphaned.map(e => e.id).join(', ')}. Reinstall them, or set ` +
            `PLUGINS_DIR to the directory that holds their code. Their config and stored data are kept, except ` +
            `for an entry an unfinished uninstall left behind, which holds no config; repeat that uninstall.`, { action: 'plugin_registry_without_code', count: orphaned.length, pluginsDir: this.pluginsDir });
    }
    loadPluginsFromDirectory(dir, failedLoads) {
        this.recoverInterruptedUpdates(dir);
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (!entry.isDirectory() || entry.name.startsWith('.'))
                continue;
            if (this.plugins.has(entry.name)) {
                this.logger.debug(`Skipped ${entry.name} in ${dir}: already loaded from another plugin directory`, {
                    pluginId: entry.name,
                    action: 'plugin_duplicate_dir_skipped',
                });
                continue;
            }
            const pluginPath = path.join(dir, entry.name);
            const manifestPath = path.join(pluginPath, 'manifest.json');
            if (!fs.existsSync(manifestPath)) {
                if (LEGACY_REMOVED_PLUGIN_IDS.has(entry.name)) {
                    this.logger.warn(`Skipped ${entry.name}: not a plugin (no manifest.json). Delete the directory to silence this, ` +
                        `or add a manifest.json if it is meant to load.`, { pluginPath, action: 'manifest_missing' });
                    try {
                        this.pluginStorage.deletePluginEntry(entry.name);
                        this.logger.log(`Pruned stale registry entry for removed built-in plugin: ${entry.name}`, {
                            action: 'registry_ghost_pruned',
                        });
                    }
                    catch {
                    }
                    continue;
                }
                const registryEntry = this.pluginStorage.getPluginEntry(entry.name);
                if (registryEntry?.builtIn) {
                    this.logger.debug(`Skipped ${entry.name}: built-in plugin storage, not a package directory`, {
                        pluginPath,
                        pluginId: entry.name,
                        action: 'builtin_storage_dir_skipped',
                    });
                }
                else if (registryEntry) {
                    this.logger.warn(`Plugin ${entry.name} is installed but its code is missing from ${pluginPath} (no manifest.json) ` +
                        `while its stored data is still there. Reinstall it: its config and stored data are kept, unless ` +
                        `an uninstall stopped part-way and left the entry with no config, in which case repeat that uninstall. ` +
                        `Plugin code kept outside the data volume does not survive a container recreate.`, { pluginPath, pluginId: entry.name, action: 'plugin_code_missing' });
                }
                else {
                    this.logger.warn(`Skipped ${entry.name}: not a plugin (no manifest.json). Delete the directory to silence this, ` +
                        `or add a manifest.json if it is meant to load.`, { pluginPath, action: 'manifest_missing' });
                }
                continue;
            }
            try {
                this.loadPlugin(pluginPath);
            }
            catch (error) {
                this.logger.error(`Failed to load plugin ${entry.name}`, error instanceof Error ? error.message : String(error), { pluginPath, action: 'plugin_load_failed' });
                this.pluginStorage.setPluginStatus(entry.name, plugin_interfaces_1.PluginStatus.ERROR);
                failedLoads.add(entry.name);
                try {
                    const { id } = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
                    if (typeof id === 'string')
                        failedLoads.add(id);
                }
                catch {
                }
            }
        }
    }
    recoverInterruptedUpdates(dir) {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            if (!entry.isDirectory())
                continue;
            const match = /^\.(.+)\.(?:bak|new)$/.exec(entry.name);
            if (!match)
                continue;
            const pluginId = match[1];
            const leftover = path.join(dir, entry.name);
            const liveDir = path.join(dir, pluginId);
            try {
                if (entry.name === (0, plugin_paths_1.pluginUpdateStagingDirName)(pluginId)) {
                    fs.rmSync(leftover, { recursive: true, force: true });
                    this.logger.warn(`Dropped stale update staging for plugin ${pluginId}`, {
                        pluginId,
                        action: 'plugin_update_staging_pruned',
                    });
                }
                else if (!fs.existsSync(liveDir)) {
                    fs.renameSync(leftover, liveDir);
                    this.logger.warn(`Restored plugin ${pluginId} from its update backup — a previous update was interrupted mid-swap`, { pluginId, action: 'plugin_update_backup_restored' });
                }
                else {
                    fs.rmSync(leftover, { recursive: true, force: true });
                    this.logger.warn(`Dropped stale update backup for plugin ${pluginId}`, {
                        pluginId,
                        action: 'plugin_update_backup_pruned',
                    });
                }
            }
            catch (error) {
                this.logger.error(`Failed to reconcile the interrupted-update leftover ${entry.name}`, error instanceof Error ? error.message : String(error), { pluginId, action: 'plugin_update_recovery_failed' });
            }
        }
    }
    loadPlugin(pluginPath) {
        const manifestPath = path.join(pluginPath, 'manifest.json');
        const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
        const manifest = JSON.parse(manifestContent);
        (0, plugin_manifest_1.validatePluginManifest)(manifest);
        (0, plugin_manifest_1.dropMalformedConfigFields)(manifest.configSchema);
        const mainPath = (0, plugin_paths_1.resolvePluginMainPath)(path.dirname(pluginPath), path.basename(pluginPath), manifest.main);
        if (!fs.existsSync(mainPath) || !fs.statSync(mainPath).isFile()) {
            throw new Error(`Plugin ${manifest.id}: main file not found in the plugin directory: ${manifest.main}`);
        }
        (0, plugin_interfaces_1.validateIngressManifest)(manifest, this.configService.get('ingress.allowUnsigned', false));
        (0, plugin_interfaces_1.warnUnauthenticatedIngressRoutes)(manifest, this.logger);
        (0, plugin_interfaces_1.warnUnsignedTimestampRoutes)(manifest, this.logger);
        if (this.plugins.has(manifest.id)) {
            throw new Error(`Plugin ${manifest.id} is already loaded`);
        }
        const storedConfig = this.pluginStorage.getPluginConfig(manifest.id) ?? {};
        const storedSessions = this.pluginStorage.getPluginSessions(manifest.id) ?? undefined;
        const storedSessionConfig = this.pluginStorage.getPluginSessionConfig(manifest.id) ?? undefined;
        const pluginInstance = {
            manifest,
            status: plugin_interfaces_1.PluginStatus.INSTALLED,
            config: (0, config_defaults_util_1.seedConfigDefaults)(manifest.configSchema, storedConfig),
            instance: null,
            loadedAt: new Date(),
            builtIn: false,
            activeSessions: storedSessions,
            sessionConfig: storedSessionConfig,
            packageDir: path.resolve(pluginPath),
        };
        this.plugins.set(manifest.id, pluginInstance);
        this.ensureRegistryEntry(manifest, false);
        this.logger.log(`Plugin loaded: ${manifest.name} v${manifest.version}`, {
            pluginId: manifest.id,
            type: manifest.type,
            action: 'plugin_loaded',
        });
        return pluginInstance;
    }
    ensureRegistryEntry(manifest, builtIn) {
        const existing = this.pluginStorage.getPluginEntry(manifest.id);
        const enabledByOperator = existing?.enabledByOperator ?? existing?.status === plugin_interfaces_1.PluginStatus.ENABLED;
        this.pluginStorage.setPluginEntry({
            id: manifest.id,
            type: manifest.type,
            name: manifest.name,
            version: manifest.version,
            status: plugin_interfaces_1.PluginStatus.INSTALLED,
            config: (0, config_defaults_util_1.seedConfigDefaults)(manifest.configSchema, existing?.config ?? {}),
            builtIn,
            installedAt: existing?.installedAt ?? new Date(),
            updatedAt: new Date(),
            activeSessions: existing?.activeSessions,
            sessionConfig: existing?.sessionConfig,
            enabledByOperator,
        });
    }
}
exports.PluginPackageScanner = PluginPackageScanner;
//# sourceMappingURL=plugin-package-scanner.js.map