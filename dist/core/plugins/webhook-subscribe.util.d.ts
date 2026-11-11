export interface OnWebhookSubscribeDeps {
    pluginId: string;
    declaredRoutes: Set<string>;
    hasPermission: boolean;
    warn: (message: string, meta: Record<string, unknown>) => void;
}
export declare function makeOnWebhookSubscribe(deps: OnWebhookSubscribeDeps): (route: string) => void;
