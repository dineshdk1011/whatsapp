export type WebhookOutboxState = 'pending' | 'queued' | 'dispatched' | 'failed';
export declare class WebhookOutboxEvent {
    id: string;
    webhookId: string;
    sessionId: string;
    event: string;
    idempotencyKey: string;
    deliveryId: string;
    payload: Record<string, unknown> | null;
    state: WebhookOutboxState | null;
    attempts: number;
    lastAttemptAt: Date | null;
    createdAt: Date;
}
