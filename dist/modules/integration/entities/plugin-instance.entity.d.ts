export declare class PluginInstance {
    id: string;
    pluginId: string;
    instanceId: string;
    sessionScope: string | null;
    secret: string;
    verifyToken: string | null;
    config: Record<string, unknown> | null;
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}
