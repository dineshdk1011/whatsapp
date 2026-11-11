export type IngressDispatchState = 'pending' | 'dispatched' | 'failed';
export declare class IngressEvent {
    id: string;
    instanceId: string;
    pluginId: string;
    providerDeliveryId: string;
    route: string;
    payload: {
        headers: Record<string, string>;
        query: Record<string, string>;
        body: string;
        rawBody: string;
        method?: string;
        admission?: {
            verified: boolean;
        };
    } | null;
    payloadHash: string | null;
    sessionId: string | null;
    dispatchState: IngressDispatchState | null;
    dispatchAttempts: number;
    lastDispatchAt: Date | null;
    createdAt: Date;
}
