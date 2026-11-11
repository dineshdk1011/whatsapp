import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Webhook } from './entities/webhook.entity';
import { WebhookOutboxService } from './webhook-outbox.service';
import { WebhookDeliveryService } from './webhook-delivery.service';
export interface WebhookReconcilerOptions {
    intervalMs: number;
    graceMs: number;
    batchSize: number;
    maxAttempts: number;
}
export declare function resolveWebhookReconcilerOptions(env?: NodeJS.ProcessEnv): WebhookReconcilerOptions;
export interface WebhookReconcileStats {
    scanned: number;
    replayed: number;
    failed: number;
    skipped: number;
}
export declare class WebhookReconcilerService implements OnModuleInit, OnModuleDestroy {
    private readonly webhooks;
    private readonly outbox;
    private readonly delivery;
    private readonly configService;
    private readonly logger;
    private timer?;
    private inFlight?;
    private readonly stop;
    private cursor?;
    constructor(webhooks: Repository<Webhook>, outbox: WebhookOutboxService, delivery: WebhookDeliveryService, configService: ConfigService);
    onModuleInit(): void;
    onModuleDestroy(): Promise<void>;
    sweep(opts: WebhookReconcilerOptions, now?: Date): Promise<WebhookReconcileStats>;
}
