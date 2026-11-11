export declare const LISTING_MEMO_TTL_MS = 5000;
export declare class ListingMemo<T> {
    private readonly ttlMs;
    private readonly entries;
    constructor(ttlMs?: number);
    read(sessionId: string, offset: number | undefined, load: () => Promise<T[]>): Promise<T[]>;
    drop(sessionId: string): void;
}
