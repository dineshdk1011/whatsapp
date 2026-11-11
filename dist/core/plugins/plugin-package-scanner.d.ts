import { ConfigService } from '@nestjs/config';
import { createLogger } from '../../common/services/logger.service';
import { PluginInstance, PluginManifest } from './plugin.interfaces';
import { PluginStorageService } from './plugin-storage.service';
export declare class PluginPackageScanner {
    private readonly logger;
    private readonly configService;
    private readonly pluginStorage;
    private readonly pluginsDir;
    private readonly legacyPluginsDir;
    private readonly plugins;
    constructor(logger: ReturnType<typeof createLogger>, configService: ConfigService, pluginStorage: PluginStorageService, pluginsDir: string, legacyPluginsDir: string | null, plugins: Map<string, PluginInstance>);
    scanAtBoot(): void;
    private warnOnRegistryEntriesWithoutCode;
    private loadPluginsFromDirectory;
    private recoverInterruptedUpdates;
    loadPlugin(pluginPath: string): PluginInstance;
    ensureRegistryEntry(manifest: PluginManifest, builtIn: boolean): void;
}
