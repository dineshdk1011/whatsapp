import { type Client, type GroupNotification } from 'whatsapp-web.js';
import { type EngineEventCallbacks, GroupEvent } from '../interfaces/whatsapp-engine.interface';
import { type createLogger } from '../../common/services/logger.service';
export declare function wwebjsGroupUpdateChanges(notification: GroupNotification): NonNullable<GroupEvent['changes']>;
export declare function wwebjsGroupRecipientIds(notification: GroupNotification): string[];
export interface WwebjsGroupEventsHost {
    readonly logger: ReturnType<typeof createLogger>;
    getCallbacks(): EngineEventCallbacks;
}
export declare function registerWwebjsGroupEvents(client: Client, host: WwebjsGroupEventsHost): void;
