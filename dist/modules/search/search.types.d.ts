import type { MessageType } from '../../engine/interfaces/whatsapp-engine.interface';
import type { MessageDirection } from '../message/entities/message.entity';
export interface SearchProvider {
    readonly id: string;
    readonly label: string;
    search(query: SearchQuery): Promise<SearchResults>;
    health(): Promise<SearchHealth>;
}
export interface SearchHealth {
    ok: boolean;
    detail?: string;
}
export type SearchMatch = 'word' | 'contains';
export interface SearchQuery {
    q: string;
    match?: SearchMatch;
    sessionIds?: string[];
    chatIds?: string[];
    sessionId?: string;
    chatId?: string;
    chatIdAliases?: string[];
    direction?: MessageDirection;
    type?: MessageType | MessageType[];
    from?: string;
    fromAliases?: string[];
    dateFrom?: number;
    dateTo?: number;
    limit?: number;
    offset?: number;
}
export interface SearchResults {
    hits: SearchHit[];
    total: number;
    tookMs: number;
    provider: string;
}
export interface SearchHit {
    messageId: string;
    waMessageId: string;
    sessionId: string;
    chatId: string;
    body: string;
    snippet: string;
    timestamp: number;
    type: MessageType;
    direction: MessageDirection;
    from: string;
    score?: number;
}
