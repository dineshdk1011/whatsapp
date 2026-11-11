import { Session } from '../../session/entities/session.entity';
import { WebhookFilters } from '../../webhook/filters/filter-types';
export declare class AutomationRule {
    id: string;
    sessionId: string;
    session: Session;
    name: string;
    enabled: boolean;
    conditions: WebhookFilters | null;
    replyText: string;
    cooldownSeconds: number;
    createdAt: Date;
    updatedAt: Date;
}
