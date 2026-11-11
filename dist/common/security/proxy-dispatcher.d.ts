import { type Dispatcher } from 'undici';
export interface ProxyDispatcherOptions {
    pinnedAddresses?: string[];
}
export declare function createProxyDispatcher(proxyUrl: string, options?: ProxyDispatcherOptions): Dispatcher;
export declare function urlFetchProxy(sessionProxyUrl: string | undefined): string | undefined;
export declare function hasUnauthenticatableSocks4Credentials(proxyUrl: string): boolean;
