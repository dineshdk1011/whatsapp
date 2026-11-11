import { withSafeFetch } from '../../common/security/ssrf-guard';
export interface PluginNetRequestInit {
    method?: string;
    headers?: Record<string, string>;
    body?: string | Uint8Array;
    timeoutMs?: number;
}
export interface PluginNetResponse {
    ok: boolean;
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: string;
}
export declare function effectiveNetAllow(allow: string[] | undefined, allowConfigHosts: string[] | undefined, config: Record<string, unknown>): string[];
export declare function isNetHostAllowed(allow: string[] | undefined, url: string): boolean;
export declare function performPluginFetch(url: string, init?: PluginNetRequestInit | null, deps?: {
    fetch?: typeof withSafeFetch;
}): Promise<PluginNetResponse>;
