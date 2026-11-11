export declare class IngressUrl {
    route: string;
    url: string;
}
export declare function buildIngressUrls(baseUrl: string | undefined, pluginId: string, instanceId: string, routes: string[]): IngressUrl[];
