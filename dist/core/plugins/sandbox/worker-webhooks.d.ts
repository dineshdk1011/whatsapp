import { HostToWorkerMessage, WorkerToHostMessage } from './protocol';
export interface WebhookRequest {
    instanceId: string;
    method: string;
    headers: Record<string, string>;
    query: Record<string, string>;
    body: string;
    rawBody: string;
    verified: boolean;
    deliveryId: string;
    sessionId?: string;
}
export type WebhookResponse = {
    status?: number;
    headers?: Record<string, string>;
    body?: string;
};
export type WebhookHandler = (req: WebhookRequest) => Promise<WebhookResponse | void> | WebhookResponse | void;
export declare class WebhookRegistry {
    private readonly post;
    private readonly handlers;
    constructor(post: (message: WorkerToHostMessage) => void);
    register(route: string, handler: WebhookHandler): void;
    handleWebhook(message: Extract<HostToWorkerMessage, {
        kind: 'webhook';
    }>): Promise<void>;
}
