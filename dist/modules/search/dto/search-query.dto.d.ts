import { MessageDirection } from '../../message/entities/message.entity';
import type { MessageType } from '../../../engine/interfaces/whatsapp-engine.interface';
import type { SearchMatch } from '../search.types';
export declare class SearchQueryDto {
    q: string;
    match?: SearchMatch;
    sessionId?: string;
    chatId?: string;
    from?: string;
    direction?: MessageDirection;
    type?: MessageType;
    dateFrom?: number;
    dateTo?: number;
    limit?: number;
    offset?: number;
}
