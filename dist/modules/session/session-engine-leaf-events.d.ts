import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Session } from './entities/session.entity';
import { EventsGateway } from '../events/events.gateway';
import { WebhookService } from '../webhook/webhook.service';
import { StatusStoreService } from '../status-store/status-store.service';
import { GroupEvent, IWhatsAppEngine } from '../../engine/interfaces/whatsapp-engine.interface';
import { type createLogger } from '../../common/services/logger.service';
export declare class SessionEngineLeafEvents {
    private readonly sessionRepository;
    private readonly eventsGateway;
    private readonly webhookService;
    private readonly configService?;
    private readonly statusStore;
    private readonly logger;
    constructor(deps: {
        sessionRepository: Repository<Session>;
        eventsGateway: EventsGateway;
        webhookService: WebhookService;
        configService?: ConfigService;
        statusStore: StatusStoreService;
        logger: ReturnType<typeof createLogger>;
    });
    seedStatuses(sessionId: string, engine: IWhatsAppEngine): Promise<void>;
    dispatchGroupEvent(id: string, event: GroupEvent): void;
    maybeAutoRejectCall(id: string, engine: IWhatsAppEngine, callId: string): Promise<void>;
}
