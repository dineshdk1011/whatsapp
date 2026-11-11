import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { WebhookOutboxEvent, WebhookOutboxState } from './entities/webhook-outbox-event.entity';
export interface ReplayableDelivery {
    id: string;
    webhookId: string;
    sessionId: string;
    event: string;
    idempotencyKey: string;
    payload: Record<string, unknown>;
    attempts: number;
    deliveryId?: string;
    state?: WebhookOutboxState | null;
}
export declare class WebhookOutboxService implements OnModuleInit, OnModuleDestroy {
    private readonly outbox;
    private readonly logger;
    private pruneTimer?;
    constructor(outbox: Repository<WebhookOutboxEvent>);
    onModuleInit(): void;
    onModuleDestroy(): void;
    pruneSettled(olderThanDays: number): Promise<number>;
    open(row: Omit<ReplayableDelivery, 'id' | 'attempts'> & {
        deliveryId: string;
    }): Promise<void>;
    close(webhookId: string, idempotencyKey: string, state: Exclude<WebhookOutboxState, 'pending' | 'queued'>): Promise<void>;
    markQueued(webhookId: string, idempotencyKey: string, deliveryId: string): Promise<void>;
    findStale(olderThan: Date, limit: number, afterId?: string, onScanned?: (lastId: string) => void): Promise<ReplayableDelivery[]>;
    countAttempt(id: string, attempts: number): Promise<boolean>;
}
