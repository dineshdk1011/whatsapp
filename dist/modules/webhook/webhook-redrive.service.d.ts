import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Webhook } from './entities/webhook.entity';
import { WebhookDeliveryFailure } from './entities/webhook-delivery-failure.entity';
import { WebhookDeliveryService } from './webhook-delivery.service';
export declare const DEFAULT_WEBHOOK_REDRIVE_LIMIT = 100;
export declare const MAX_WEBHOOK_REDRIVE_LIMIT = 500;
export interface WebhookRedriveRequest {
    sessionId?: string;
    webhookId?: string;
    ids?: string[];
    limit?: number;
}
export interface WebhookRedriveResult {
    redriven: number;
    delivered: number;
    enqueued: number;
    failed: number;
    skipped: number;
    remaining: number;
}
export declare class WebhookRedriveService implements OnModuleDestroy {
    private readonly webhookRepository;
    private readonly failureRepository;
    private readonly delivery;
    private readonly configService;
    private readonly logger;
    private running;
    private readonly stop;
    constructor(webhookRepository: Repository<Webhook>, failureRepository: Repository<WebhookDeliveryFailure>, delivery: WebhookDeliveryService, configService: ConfigService);
    onModuleDestroy(): Promise<void>;
    redrive(request: WebhookRedriveRequest, allowedSessions?: string[] | null): Promise<WebhookRedriveResult>;
    private redriveBatch;
    private redriveRow;
    private readPayload;
    private attemptsUnchanged;
    private bumpAttempts;
}
