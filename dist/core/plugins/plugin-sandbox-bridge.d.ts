import { ConfigService } from '@nestjs/config';
import { createLogger } from '../../common/services/logger.service';
import { HookManager } from '../hooks';
import { PluginInstance } from './plugin.interfaces';
import { PluginStorageService } from './plugin-storage.service';
import { PluginHostServices } from './plugin-host-services';
import { PluginCapabilityContext } from './plugin-capability-context';
import { PluginWorkerHost } from './sandbox/plugin-worker-host';
import { PluginLogLevel } from './sandbox/protocol';
import type { IngressJobData } from '../../modules/queue/processors/ingress.processor';
type CreateSandboxHostFn = (capDispatcher?: (verb: string, args: unknown[]) => Promise<unknown>, onHookSubscribe?: (event: string, priority?: number) => void, onWebhookSubscribe?: (route: string) => void, onLog?: (level: PluginLogLevel, message: string, meta?: Record<string, unknown>) => void, runWithHookGuard?: (inFlightEvents: string[], run: () => Promise<unknown>) => Promise<unknown>, onSearchProviderRegister?: () => void, onWorkerExit?: (code: number, intentional: boolean, reason?: string) => void, onUnresponsive?: () => void) => PluginWorkerHost;
export declare class PluginSandboxBridge {
    private readonly logger;
    private readonly hookManager;
    private readonly capabilities;
    private readonly hostServices;
    private readonly configService;
    private readonly pluginStorage;
    private readonly plugins;
    private readonly sandboxHosts;
    private readonly lastSandboxHookError;
    private readonly pluginsDir;
    private readonly createHost;
    private readonly resolvePluginMainPath;
    constructor(logger: ReturnType<typeof createLogger>, hookManager: HookManager, capabilities: PluginCapabilityContext, hostServices: PluginHostServices, configService: ConfigService, pluginStorage: PluginStorageService, plugins: Map<string, PluginInstance>, sandboxHosts: Map<string, PluginWorkerHost>, lastSandboxHookError: Map<string, {
        event: string;
        error: string;
        at: Date;
    }>, pluginsDir: string, createHost: CreateSandboxHostFn, resolvePluginMainPath: (pluginsDir: string, pluginId: string, main: string) => string);
    private recordSandboxHookError;
    checkPluginHealth(pluginId: string): Promise<{
        healthy: boolean;
        message?: string;
    }>;
    dispatchWebhookForInstance(d: IngressJobData): Promise<void>;
    private scopeHasAtMostOneInstance;
    enableSandboxed(pluginId: string, plugin: PluginInstance): Promise<void>;
    teardownSandboxed(pluginId: string, host: PluginWorkerHost, opts?: {
        unload?: boolean;
    }): Promise<void>;
    private buildHookSubscribeHandler;
    private buildLogRelay;
    private buildSearchProviderRegistrar;
    private markWorkerFailed;
    private buildWorkerExitHandler;
}
export {};
