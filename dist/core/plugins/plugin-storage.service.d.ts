import { ConfigService } from '@nestjs/config';
import { PluginStatus, PluginStorage, PluginRegistryEntry } from './plugin.interfaces';
export declare class PluginRegistryWriteError extends Error {
    constructor(cause: unknown);
}
export interface RegistryWriteOptions {
    mustPersist?: boolean;
}
export declare class PluginStorageService {
    private readonly configService;
    private readonly logger;
    private readonly dataDir;
    private readonly registryPath;
    private readonly maxPluginStorageBytes;
    private readonly storageUsage;
    private registry;
    constructor(configService: ConfigService);
    private loadRegistry;
    private saveRegistry;
    private writeRegistry;
    private commitEntryChange;
    getPluginEntry(pluginId: string): PluginRegistryEntry | undefined;
    setPluginEntry(entry: PluginRegistryEntry): void;
    deletePluginEntry(pluginId: string): void;
    getAllEntries(): PluginRegistryEntry[];
    getPluginStatus(pluginId: string): PluginStatus | null;
    setPluginStatus(pluginId: string, status: PluginStatus): void;
    setPluginEnabledByOperator(pluginId: string, enabled: boolean): void;
    clearOperatorSettings(pluginId: string, opts?: RegistryWriteOptions): void;
    getPluginConfig(pluginId: string): Record<string, unknown> | null;
    setPluginConfig(pluginId: string, config: Record<string, unknown>, opts?: RegistryWriteOptions): void;
    getPluginSessions(pluginId: string): string[] | null;
    setPluginSessions(pluginId: string, sessions: string[], opts?: RegistryWriteOptions): void;
    getPluginSessionConfig(pluginId: string): Record<string, Record<string, unknown>> | null;
    setPluginSessionConfig(pluginId: string, sessionConfig: Record<string, Record<string, unknown>>, opts?: RegistryWriteOptions): void;
    deletePluginData(pluginId: string): void;
    private assertStorageQuota;
    private scanStorageBytes;
    private releaseStorageBytes;
    createPluginStorage(pluginId: string): PluginStorage;
}
