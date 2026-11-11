import { ConfigService } from '@nestjs/config';
import { createLogger } from '../../common/services/logger.service';
import { HookManager } from '../hooks';
import { IPlugin, PluginInstance, PluginManifest } from './plugin.interfaces';
import { PluginStorageService, type RegistryWriteOptions } from './plugin-storage.service';
import { PluginHostServices } from './plugin-host-services';
import { PluginCapabilityContext } from './plugin-capability-context';
import { PluginSandboxBridge } from './plugin-sandbox-bridge';
import { PluginWorkerHost } from './sandbox/plugin-worker-host';
export declare class PluginLifecycle {
    private readonly logger;
    private readonly configService;
    private readonly hookManager;
    private readonly pluginStorage;
    private readonly capabilities;
    private readonly sandboxBridge;
    private readonly hostServices;
    private readonly ensureRegistryEntry;
    private readonly plugins;
    private readonly sandboxHosts;
    private readonly lastSandboxHookError;
    private readonly pluginsDir;
    private readonly enabling;
    private readonly disabling;
    private readonly builtInBase;
    constructor(logger: ReturnType<typeof createLogger>, configService: ConfigService, hookManager: HookManager, pluginStorage: PluginStorageService, capabilities: PluginCapabilityContext, sandboxBridge: PluginSandboxBridge, hostServices: PluginHostServices, ensureRegistryEntry: (manifest: PluginManifest, builtIn: boolean) => void, plugins: Map<string, PluginInstance>, sandboxHosts: Map<string, PluginWorkerHost>, lastSandboxHookError: Map<string, {
        event: string;
        error: string;
        at: Date;
    }>, pluginsDir: string);
    enablePlugin(pluginId: string): Promise<void>;
    disablePlugin(pluginId: string, opts?: {
        unload?: boolean;
    }): Promise<void>;
    private teardown;
    unloadPlugin(pluginId: string): Promise<void>;
    updatePluginConfig(pluginId: string, config: Record<string, unknown>, opts?: RegistryWriteOptions): void;
    setPluginSessions(pluginId: string, sessions: string[], opts?: RegistryWriteOptions): PluginInstance;
    setPluginSessionConfig(pluginId: string, sessionId: string, config: Record<string, unknown>, opts?: RegistryWriteOptions): PluginInstance;
    private enableInProcess;
    registerBuiltInPlugin(manifest: PluginManifest, instance: IPlugin, config?: Record<string, unknown>): void;
}
