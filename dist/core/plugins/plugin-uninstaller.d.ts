import { createLogger } from '../../common/services/logger.service';
import { PluginInstance } from './plugin.interfaces';
import { PluginStorageService } from './plugin-storage.service';
export declare class PluginUninstallingError extends Error {
    constructor(pluginId: string);
}
export declare class PluginUninstallIncompleteError extends Error {
    constructor(cause: unknown);
}
export declare function assertNotUninstalling(pluginId: string, plugin: PluginInstance): void;
export declare class PluginUninstaller {
    private readonly logger;
    private readonly plugins;
    private readonly pluginStorage;
    private readonly pluginsDir;
    private readonly unload;
    private readonly legacyPluginsDir;
    private readonly releaseTakeovers?;
    constructor(logger: ReturnType<typeof createLogger>, plugins: Map<string, PluginInstance>, pluginStorage: PluginStorageService, pluginsDir: string, unload: (pluginId: string) => Promise<void>, legacyPluginsDir?: string | null, releaseTakeovers?: ((pluginId: string) => Promise<void>) | undefined);
    private readonly unloadedDirs;
    private resolveUninstallDir;
    uninstallPlugin(pluginId: string): Promise<{
        registryEntryKept: boolean;
    }>;
    private removeEmptied;
}
