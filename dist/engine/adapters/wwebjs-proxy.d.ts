export declare function isSupportedProxyUrl(url: string): boolean;
export interface ProxyLaunchConfig {
    serverArg: string;
    proxyAuthentication?: {
        username: string;
        password: string;
    };
    socksAuthUnsupported: boolean;
}
export declare function buildProxyLaunchConfig(url: string): ProxyLaunchConfig;
