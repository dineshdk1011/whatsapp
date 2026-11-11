"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginLifecycle = void 0;
const plugin_interfaces_1 = require("./plugin.interfaces");
const search_provider_registration_util_1 = require("./search-provider-registration.util");
const plugin_paths_1 = require("./plugin-paths");
const plugin_uninstaller_1 = require("./plugin-uninstaller");
class PluginLifecycle {
    logger;
    configService;
    hookManager;
    pluginStorage;
    capabilities;
    sandboxBridge;
    hostServices;
    ensureRegistryEntry;
    plugins;
    sandboxHosts;
    lastSandboxHookError;
    pluginsDir;
    enabling = new Set();
    disabling = new Map();
    builtInBase = new Map();
    constructor(logger, configService, hookManager, pluginStorage, capabilities, sandboxBridge, hostServices, ensureRegistryEntry, plugins, sandboxHosts, lastSandboxHookError, pluginsDir) {
        this.logger = logger;
        this.configService = configService;
        this.hookManager = hookManager;
        this.pluginStorage = pluginStorage;
        this.capabilities = capabilities;
        this.sandboxBridge = sandboxBridge;
        this.hostServices = hostServices;
        this.ensureRegistryEntry = ensureRegistryEntry;
        this.plugins = plugins;
        this.sandboxHosts = sandboxHosts;
        this.lastSandboxHookError = lastSandboxHookError;
        this.pluginsDir = pluginsDir;
    }
    async enablePlugin(pluginId) {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) {
            throw new Error(`Plugin ${pluginId} not found`);
        }
        if (plugin.status === plugin_interfaces_1.PluginStatus.ENABLED) {
            return;
        }
        if (plugin.manifest.type === plugin_interfaces_1.PluginType.ENGINE) {
            const activeEngine = this.configService.get('engine.type') ?? 'whatsapp-web.js';
            if (pluginId !== activeEngine) {
                throw new Error(`Engine "${pluginId}" is not the active engine ("${activeEngine}"). Set engine.type and restart to switch engines.`);
            }
        }
        if (this.enabling.has(pluginId)) {
            throw new Error(`Plugin ${pluginId} is already being enabled`);
        }
        this.enabling.add(pluginId);
        try {
            if (plugin.builtIn === false) {
                await this.sandboxBridge.enableSandboxed(pluginId, plugin);
            }
            else {
                await this.enableInProcess(pluginId, plugin);
            }
            plugin.status = plugin_interfaces_1.PluginStatus.ENABLED;
            plugin.enabledAt = new Date();
            plugin.error = undefined;
            this.pluginStorage.setPluginStatus(pluginId, plugin_interfaces_1.PluginStatus.ENABLED);
            this.logger.log(`Plugin enabled: ${plugin.manifest.name}`, {
                pluginId,
                action: 'plugin_enabled',
            });
        }
        catch (error) {
            plugin.status = plugin_interfaces_1.PluginStatus.ERROR;
            plugin.error = error instanceof Error ? error.message : String(error);
            this.pluginStorage.setPluginStatus(pluginId, plugin_interfaces_1.PluginStatus.ERROR);
            this.hookManager.unregisterPlugin(pluginId);
            throw error;
        }
        finally {
            this.enabling.delete(pluginId);
        }
    }
    async disablePlugin(pluginId, opts) {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) {
            throw new Error(`Plugin ${pluginId} not found`);
        }
        if (plugin.status !== plugin_interfaces_1.PluginStatus.ENABLED) {
            return;
        }
        const inFlight = this.disabling.get(pluginId);
        if (inFlight) {
            return inFlight;
        }
        const disabling = this.teardown(pluginId, plugin, opts).finally(() => this.disabling.delete(pluginId));
        this.disabling.set(pluginId, disabling);
        return disabling;
    }
    async teardown(pluginId, plugin, opts) {
        try {
            const host = this.sandboxHosts.get(pluginId);
            if (host) {
                await this.sandboxBridge.teardownSandboxed(pluginId, host, opts);
            }
            else {
                const context = this.capabilities.createPluginContext(plugin);
                if (plugin.instance?.onDisable) {
                    await plugin.instance.onDisable(context);
                }
            }
            this.hookManager.unregisterPlugin(pluginId);
            (0, search_provider_registration_util_1.unregisterPluginSearchProvider)(this.hostServices.getSearchRegistryPort(), pluginId);
            plugin.status = plugin_interfaces_1.PluginStatus.DISABLED;
            this.pluginStorage.setPluginStatus(pluginId, plugin_interfaces_1.PluginStatus.DISABLED);
            this.lastSandboxHookError.delete(pluginId);
            this.logger.log(`Plugin disabled: ${plugin.manifest.name}`, {
                pluginId,
                action: 'plugin_disabled',
            });
        }
        catch (error) {
            plugin.status = plugin_interfaces_1.PluginStatus.ERROR;
            plugin.error = error instanceof Error ? error.message : String(error);
            throw error;
        }
    }
    async unloadPlugin(pluginId) {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) {
            throw new Error(`Plugin ${pluginId} not found`);
        }
        if (plugin.status === plugin_interfaces_1.PluginStatus.ENABLED) {
            await this.disablePlugin(pluginId, { unload: true });
        }
        if (plugin.instance?.onUnload) {
            const context = this.capabilities.createPluginContext(plugin);
            await plugin.instance.onUnload(context);
        }
        this.plugins.delete(pluginId);
        this.logger.log(`Plugin unloaded: ${plugin.manifest.name}`, {
            pluginId,
            action: 'plugin_unloaded',
        });
    }
    updatePluginConfig(pluginId, config, opts) {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) {
            throw new Error(`Plugin ${pluginId} not found`);
        }
        (0, plugin_uninstaller_1.assertNotUninstalling)(pluginId, plugin);
        const base = this.builtInBase.get(pluginId) ?? {};
        const cleared = this.builtInBase.has(pluginId) ? Object.keys(config).filter(key => config[key] === null) : [];
        const stored = { ...(this.pluginStorage.getPluginConfig(pluginId) ?? {}), ...config };
        for (const key of cleared)
            delete stored[key];
        this.pluginStorage.setPluginConfig(pluginId, stored, opts);
        const next = { ...plugin.config, ...config };
        for (const key of cleared) {
            if (Object.hasOwn(base, key))
                next[key] = base[key];
            else
                delete next[key];
        }
        plugin.config = next;
        if (plugin.status === plugin_interfaces_1.PluginStatus.ENABLED) {
            const sandboxHost = this.sandboxHosts.get(pluginId);
            if (sandboxHost) {
                sandboxHost.sendConfigChange(plugin.config);
            }
            else if (plugin.instance?.onConfigChange) {
                const context = this.capabilities.createPluginContext(plugin);
                void plugin.instance.onConfigChange(context, plugin.config);
            }
        }
        this.logger.debug(`Plugin config updated: ${pluginId}`, {
            pluginId,
            action: 'plugin_config_updated',
        });
    }
    setPluginSessions(pluginId, sessions, opts) {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) {
            throw new Error(`Plugin ${pluginId} not found`);
        }
        (0, plugin_uninstaller_1.assertNotUninstalling)(pluginId, plugin);
        if (plugin.manifest.sessionScoped === false) {
            throw new Error(`Plugin ${pluginId} is global (not session-scoped) and cannot be activated per session`);
        }
        this.pluginStorage.setPluginSessions(pluginId, sessions, opts);
        plugin.activeSessions = sessions;
        this.logger.log(`Plugin active sessions updated: ${pluginId}`, {
            pluginId,
            action: 'plugin_sessions_updated',
            sessions,
        });
        return plugin;
    }
    setPluginSessionConfig(pluginId, sessionId, config, opts) {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) {
            throw new Error(`Plugin ${pluginId} not found`);
        }
        (0, plugin_uninstaller_1.assertNotUninstalling)(pluginId, plugin);
        if (plugin.manifest.sessionScoped === false) {
            throw new Error(`Plugin ${pluginId} is global (not session-scoped) and has no per-session config`);
        }
        const next = { ...(plugin.sessionConfig ?? {}) };
        if (config && Object.keys(config).length > 0) {
            next[sessionId] = config;
        }
        else {
            delete next[sessionId];
        }
        this.pluginStorage.setPluginSessionConfig(pluginId, next, opts);
        plugin.sessionConfig = next;
        this.logger.debug(`Plugin session config updated: ${pluginId}`, {
            pluginId,
            action: 'plugin_session_config_updated',
            sessionId,
        });
        return plugin;
    }
    async enableInProcess(pluginId, plugin) {
        const context = this.capabilities.createPluginContext(plugin);
        if (!plugin.instance) {
            const mainPath = (0, plugin_paths_1.resolvePluginMainPath)(this.pluginsDir, pluginId, plugin.manifest.main);
            const pluginModule = require(mainPath);
            if (pluginModule.default) {
                plugin.instance = new pluginModule.default();
            }
            else {
                throw new Error(`Plugin ${pluginId} does not export a default class`);
            }
        }
        if (plugin.instance.onLoad) {
            await plugin.instance.onLoad(context);
        }
        if (plugin.instance.onEnable) {
            await plugin.instance.onEnable(context);
        }
    }
    registerBuiltInPlugin(manifest, instance, config = {}) {
        const effectiveConfig = { ...config, ...(this.pluginStorage.getPluginConfig(manifest.id) ?? {}) };
        this.builtInBase.set(manifest.id, { ...config });
        const pluginInstance = {
            manifest,
            status: plugin_interfaces_1.PluginStatus.INSTALLED,
            config: effectiveConfig,
            instance,
            loadedAt: new Date(),
            builtIn: true,
            activeSessions: this.pluginStorage.getPluginSessions(manifest.id) ?? undefined,
            sessionConfig: this.pluginStorage.getPluginSessionConfig(manifest.id) ?? undefined,
        };
        this.plugins.set(manifest.id, pluginInstance);
        this.ensureRegistryEntry(manifest, true);
        this.logger.debug(`Built-in plugin registered: ${manifest.name}`, {
            pluginId: manifest.id,
            action: 'builtin_plugin_registered',
        });
    }
}
exports.PluginLifecycle = PluginLifecycle;
//# sourceMappingURL=plugin-lifecycle.js.map