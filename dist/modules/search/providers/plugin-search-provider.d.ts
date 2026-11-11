import type { SearchProvider, SearchQuery, SearchResults, SearchHealth } from '../search.types';
export interface PluginSearchTransport {
    dispatchSearch(options: {
        query: SearchQuery;
        timeoutMs: number;
    }): Promise<{
        ok: true;
        results: SearchResults;
    } | {
        ok: false;
        error: string;
    }>;
    healthCheck(timeoutMs: number): Promise<{
        healthy: boolean;
        message?: string;
    }>;
}
export declare function validatePluginSearchResults(results: unknown): string | null;
export declare class PluginSearchProvider implements SearchProvider {
    readonly label: string;
    private readonly transport;
    private readonly timeoutMs;
    readonly id: string;
    constructor(pluginId: string, label: string, transport: PluginSearchTransport, timeoutMs: number);
    search(query: SearchQuery): Promise<SearchResults>;
    health(): Promise<SearchHealth>;
}
