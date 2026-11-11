import type { GroupMetadata } from '@whiskeysockets/baileys';
export declare function groupMetadataCacheTtlMs(): number;
export declare class GroupMetadataCache {
    private readonly ttlMs;
    private readonly maxEntries;
    private readonly now;
    private readonly entries;
    private readonly inFlight;
    private expiryTimer?;
    constructor(ttlMs: number, maxEntries?: number, now?: () => number);
    get enabled(): boolean;
    get size(): number;
    peek(jid: string): GroupMetadata | undefined;
    read(jid: string, fetch: () => Promise<GroupMetadata>): Promise<GroupMetadata | undefined>;
    invalidate(jid: string | null | undefined): void;
    clear(): void;
    applyUpdates(updates: ReadonlyArray<Partial<GroupMetadata>> | undefined): void;
    private store;
    private scheduleExpiry;
}
