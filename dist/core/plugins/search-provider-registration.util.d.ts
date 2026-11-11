import type { PluginSearchTransport } from '../../modules/search/providers/plugin-search-provider';
import type { PluginSearchRegistryPort } from './plugin-host-ports';
export interface RegisterPluginSearchProviderDeps {
    pluginId: string;
    label: string;
    transport: PluginSearchTransport;
    timeoutMs: number;
    registry: PluginSearchRegistryPort | undefined;
    mode: string;
    hasPermission: boolean;
    warn: (message: string, meta: Record<string, unknown>) => void;
}
export declare function registerPluginSearchProvider(deps: RegisterPluginSearchProviderDeps): void;
export declare function unregisterPluginSearchProvider(registry: PluginSearchRegistryPort | undefined, pluginId: string): void;
