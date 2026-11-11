import { WebhookService } from './webhook.service';
import { WebhookRedriveResult, WebhookRedriveService } from './webhook-redrive.service';
import { WebhookResponseDto, RedriveWebhookDeliveriesDto } from './dto';
import { WebhookDeliveryFailure } from './entities/webhook-delivery-failure.entity';
import { ApiKey } from '../auth/entities/api-key.entity';
import { AuditService } from '../audit/audit.service';
export declare class WebhooksListController {
    private readonly webhookService;
    private readonly redriveService;
    private readonly audit;
    constructor(webhookService: WebhookService, redriveService: WebhookRedriveService, audit: AuditService);
    deliveryFailures(apiKey?: ApiKey, sessionId?: string, limit?: string, offset?: string): Promise<Array<WebhookDeliveryFailure & {
        replayable: boolean;
    }>>;
    redriveDeliveryFailures(dto: RedriveWebhookDeliveriesDto, apiKey?: ApiKey): Promise<WebhookRedriveResult>;
    findAll(apiKey?: ApiKey, limit?: string, offset?: string): Promise<WebhookResponseDto[]>;
}
