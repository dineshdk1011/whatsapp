import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Webhook } from './entities/webhook.entity';
import { WebhookDeliveryFailure } from './entities/webhook-delivery-failure.entity';
import { Session } from '../session/entities/session.entity';
import { CreateWebhookDto, UpdateWebhookDto } from './dto';
import { ListOptions } from '../../common/utils/paginate';
import { WebhookDeliveryService } from './webhook-delivery.service';
export type { WebhookPayload, WebhookJobData } from './webhook-delivery.service';
export declare class WebhookService implements OnModuleInit, OnModuleDestroy {
    private readonly webhookRepository;
    private readonly failureRepository;
    private readonly sessionRepository;
    private readonly configService;
    private readonly delivery;
    private readonly logger;
    private cleanupTimer?;
    private payloadCleanupTimer?;
    constructor(webhookRepository: Repository<Webhook>, failureRepository: Repository<WebhookDeliveryFailure>, sessionRepository: Repository<Session>, configService: ConfigService, delivery: WebhookDeliveryService);
    onModuleInit(): void;
    onModuleDestroy(): void;
    pruneDeliveryFailures(olderThanDays: number): Promise<number>;
    pruneDeliveryFailurePayloads(olderThanHours: number): Promise<number>;
    private schedulePayloadPrune;
    private validateWebhookUrl;
    create(sessionId: string, dto: CreateWebhookDto): Promise<Webhook>;
    findBySession(sessionId: string): Promise<Webhook[]>;
    findAll(allowedSessions?: string[] | null, opts?: ListOptions): Promise<Webhook[]>;
    listDeliveryFailures(opts?: ListOptions & {
        sessionId?: string;
    }, allowedSessions?: string[] | null): Promise<Array<WebhookDeliveryFailure & {
        replayable: boolean;
    }>>;
    findOne(sessionId: string, id: string): Promise<Webhook>;
    update(sessionId: string, id: string, dto: UpdateWebhookDto): Promise<Webhook>;
    delete(sessionId: string, id: string): Promise<void>;
    test(sessionId: string, webhookId: string): Promise<{
        success: boolean;
        statusCode?: number;
        error?: string;
    }>;
    dispatch(sessionId: string, event: string, data: Record<string, unknown>): Promise<void>;
}
