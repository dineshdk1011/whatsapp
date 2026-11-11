import { WebhookService } from './webhook.service';
import { CreateWebhookDto, UpdateWebhookDto, WebhookResponseDto } from './dto';
export declare class WebhookController {
    private readonly webhookService;
    constructor(webhookService: WebhookService);
    create(sessionId: string, dto: CreateWebhookDto): Promise<WebhookResponseDto>;
    findBySession(sessionId: string): Promise<WebhookResponseDto[]>;
    findOne(sessionId: string, id: string): Promise<WebhookResponseDto>;
    update(sessionId: string, id: string, dto: UpdateWebhookDto): Promise<WebhookResponseDto>;
    test(sessionId: string, id: string): Promise<{
        success: boolean;
        statusCode?: number;
        error?: string;
    }>;
    delete(sessionId: string, id: string): Promise<void>;
}
