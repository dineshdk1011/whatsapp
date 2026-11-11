export declare class SearchHitDto {
    messageId: string;
    waMessageId: string;
    sessionId: string;
    chatId: string;
    body: string;
    snippet: string;
    timestamp: number;
    type: string;
    direction: string;
    from: string;
    score?: number;
}
export declare class SearchResultsResponseDto {
    hits: SearchHitDto[];
    total: number;
    tookMs: number;
    provider: string;
}
