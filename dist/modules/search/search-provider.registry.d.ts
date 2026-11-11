import type { SearchProvider } from './search.types';
import type { PluginSearchRegistryPort } from '../../core/plugins/plugin-host-ports';
export declare class SearchProviderRegistry implements PluginSearchRegistryPort {
    private readonly providers;
    private activeId;
    register(provider: SearchProvider): void;
    unregister(id: string): void;
    setActive(id: string): void;
    active(): SearchProvider | null;
    list(): SearchProvider[];
}
