import { Session } from '../../session/entities/session.entity';
import { WebhookFilters } from '../filters/filter-types';
export declare class Webhook {
    id: string;
    sessionId: string;
    session: Session;
    url: string;
    events: string[];
    secret: string | null;
    headers: Record<string, string>;
    filters: WebhookFilters | null;
    active: boolean;
    retryCount: number;
    lastTriggeredAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
