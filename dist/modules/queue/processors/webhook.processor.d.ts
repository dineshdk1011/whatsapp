import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { WebhookJobData } from '../../webhook/webhook.service';
import { Webhook } from '../../webhook/entities/webhook.entity';
import { WebhookOutboxService } from '../../webhook/webhook-outbox.service';
import { WebhookDeliveryFailure } from '../../webhook/entities/webhook-delivery-failure.entity';
import { HookManager } from '../../../core/hooks';
export interface WebhookJobResult {
    statusCode: number;
    success: boolean;
    error?: string;
    responseTime: number;
}
export declare class WebhookProcessor extends WorkerHost {
    private readonly webhookRepository;
    private readonly failureRepository;
    private readonly hookManager;
    private readonly configService;
    private readonly outbox;
    private readonly logger;
    private readonly failingWebhooks;
    private readonly degradedInFlight;
    private readonly degradedSessionConcurrency;
    constructor(webhookRepository: Repository<Webhook>, failureRepository: Repository<WebhookDeliveryFailure>, hookManager: HookManager, configService: ConfigService, outbox: WebhookOutboxService);
    onModuleDestroy(): Promise<void>;
    process(job: Job<WebhookJobData>, token?: string): Promise<WebhookJobResult>;
    private deliver;
    private loadDeliverableWebhook;
    private postToReceiver;
    private recordSuccessfulDelivery;
    private recordDeliveryFailure;
    onWorkerFailed(job: Job<WebhookJobData> | undefined, error: Error): Promise<void>;
}
