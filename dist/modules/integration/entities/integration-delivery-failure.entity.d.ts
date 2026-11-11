export declare class IntegrationDeliveryFailure {
    id: string;
    direction: 'inbound' | 'outbound';
    pluginId: string;
    instanceId: string;
    sessionId: string | null;
    deliveryId: string | null;
    attempts: number;
    lastError: string;
    payload: Record<string, unknown> | null;
    redriven: boolean;
    createdAt: Date;
}
