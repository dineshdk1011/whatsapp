export type SendIdempotencyState = 'pending' | 'completed' | 'failed';
export declare class SendIdempotencyKey {
    id: string;
    sessionId: string;
    idempotencyKey: string;
    route: string;
    requestHash: string;
    state: SendIdempotencyState;
    responseBody: Record<string, unknown> | null;
    expiresAt: Date;
    createdAt: Date;
}
