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
exports.PluginUninstaller = exports.PluginUninstallIncompleteError = exports.PluginUninstallingError = void 0;
exports.assertNotUninstalling = assertNotUninstalling;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const plugin_storage_service_1 = require("./plugin-storage.service");
const uninstalling = new WeakSet();
class PluginUninstallingError extends Error {
    constructor(pluginId) {
        super(`Plugin ${pluginId} is being uninstalled; the change was not applied`);
        this.name = 'PluginUninstallingError';
    }
}
exports.PluginUninstallingError = PluginUninstallingError;
class PluginUninstallIncompleteError extends Error {
    constructor(cause) {
        super(cause instanceof Error ? cause.message : String(cause), { cause });
        this.name = 'PluginUninstallIncompleteError';
    }
}
exports.PluginUninstallIncompleteError = PluginUninstallIncompleteError;
function assertNotUninstalling(pluginId, plugin) {
    if (uninstalling.has(plugin))
        throw new PluginUninstallingError(pluginId);
}
class PluginUninstaller {
    logger;
    plugins;
    pluginStorage;
    pluginsDir;
    unload;
    legacyPluginsDir;
    releaseTakeovers;
    constructor(logger, plugins, pluginStorage, pluginsDir, unload, legacyPluginsDir = null, releaseTakeovers) {
        this.logger = logger;
        this.plugins = plugins;
        this.pluginStorage = pluginStorage;
        this.pluginsDir = pluginsDir;
        this.unload = unload;
        this.legacyPluginsDir = legacyPluginsDir;
        this.releaseTakeovers = releaseTakeovers;
    }
    unloadedDirs = new Map();
    resolveUninstallDir(root, pluginId) {
        const base = path.resolve(root);
        const dir = path.resolve(base, pluginId);
        return dir !== base && dir.startsWith(base + path.sep) ? dir : null;
    }
    async uninstallPlugin(pluginId) {
        if (this.pluginStorage.getPluginEntry(pluginId)?.builtIn) {
            throw new Error(`Cannot uninstall built-in plugin ${pluginId}`);
        }
        this.pluginStorage.clearOperatorSettings(pluginId, { mustPersist: true });
        try {
            return await this.removeEmptied(pluginId);
        }
        catch (error) {
            throw new PluginUninstallIncompleteError(error);
        }
    }
    async removeEmptied(pluginId) {
        const recordedDir = this.plugins.get(pluginId)?.packageDir ?? this.unloadedDirs.get(pluginId) ?? null;
        if (recordedDir)
            this.unloadedDirs.set(pluginId, recordedDir);
        const loaded = this.plugins.get(pluginId);
        if (loaded) {
            uninstalling.add(loaded);
            try {
                await this.unload(pluginId);
            }
            finally {
                uninstalling.delete(loaded);
            }
        }
        await this.releaseTakeovers?.(pluginId);
        const dir = recordedDir ?? this.resolveUninstallDir(this.pluginsDir, pluginId);
        if (dir && fs.existsSync(dir)) {
            fs.rmSync(dir, { recursive: true, force: true });
        }
        if (this.legacyPluginsDir) {
            const legacyDir = this.resolveUninstallDir(this.legacyPluginsDir, pluginId);
            if (legacyDir && fs.existsSync(path.join(legacyDir, 'manifest.json'))) {
                fs.rmSync(legacyDir, { recursive: true, force: true });
            }
        }
        this.pluginStorage.deletePluginData(pluginId);
        let registryEntryKept = false;
        try {
            this.pluginStorage.deletePluginEntry(pluginId);
        }
        catch (error) {
            if (!(error instanceof plugin_storage_service_1.PluginRegistryWriteError))
                throw error;
            this.pluginStorage.clearOperatorSettings(pluginId);
            registryEntryKept = true;
            this.logger.warn(`Plugin ${pluginId} uninstalled, but its registry entry could not be removed`, {
                pluginId,
                action: 'plugin_uninstall_registry_entry_kept',
            });
        }
        this.unloadedDirs.delete(pluginId);
        this.logger.log(`Plugin uninstalled: ${pluginId}`, { pluginId, action: 'plugin_uninstalled' });
        return { registryEntryKept };
    }
}
exports.PluginUninstaller = PluginUninstaller;
//# sourceMappingURL=plugin-uninstaller.js.map