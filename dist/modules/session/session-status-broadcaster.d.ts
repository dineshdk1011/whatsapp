import { Repository } from 'typeorm';
import { Session, SessionStatus } from './entities/session.entity';
import { EventsGateway } from '../events/events.gateway';
import { WebhookService } from '../webhook/webhook.service';
import { type createLogger } from '../../common/services/logger.service';
export declare class SessionStatusBroadcaster {
    readonly lastDispatchedStatus: Map<string, SessionStatus>;
    private readonly sessionRepository;
    private readonly eventsGateway;
    private readonly webhookService;
    private readonly logger;
    constructor(deps: {
        sessionRepository: Repository<Session>;
        eventsGateway: EventsGateway;
        webhookService: WebhookService;
        logger: ReturnType<typeof createLogger>;
    });
    updateStatus(id: string, status: SessionStatus, canAnnounce?: () => boolean): Promise<void>;
    announce(id: string, status: SessionStatus): void;
    clear(id: string): void;
}
