import { Repository } from 'typeorm';
import { withSafeFetch } from '../../../common/security/ssrf-guard';
import { type LoggerService } from '../../../common/services/logger.service';
import { WebhookDeliveryFailure } from '../entities/webhook-delivery-failure.entity';
import { recordWebhookDeliveryFailure } from './record-delivery-failure';
export declare function sanitizeCustomHeaders(custom: Record<string, string> | null | undefined): Record<string, string>;
export declare function isDeliverableWebhook<T extends {
    active: boolean;
    events: string[];
    sessionId?: string;
}>(row: T | null | undefined, event: string, sessionId?: string): row is T;
export declare function generateSignature(payload: string, secret: string): string;
export declare function buildDeliveryHeaders(webhook: {
    headers?: Record<string, string> | null;
    secret?: string | null;
}, event: string, idempotencyKey: string, deliveryId: string, body: string, retryCount?: number): Record<string, string>;
export declare function postWebhookPayload(url: string, body: string, headers: Record<string, string>, timeoutMs: number, fetch?: typeof withSafeFetch): Promise<{
    status: number;
    statusText: string;
}>;
export declare function recordTerminalFailure(failureRepository: Repository<WebhookDeliveryFailure>, logger: LoggerService, input: Omit<Parameters<typeof recordWebhookDeliveryFailure>[2], 'lastStatusCode' | 'lastError'> & {
    error: unknown;
}): Promise<boolean | null>;
