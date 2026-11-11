"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListingMemo = exports.LISTING_MEMO_TTL_MS = void 0;
exports.LISTING_MEMO_TTL_MS = 5_000;
class ListingMemo {
    ttlMs;
    entries = new Map();
    constructor(ttlMs = exports.LISTING_MEMO_TTL_MS) {
        this.ttlMs = ttlMs;
    }
    async read(sessionId, offset, load) {
        let entry = this.entries.get(sessionId);
        if (!(entry && (offset ?? 0) > 0 && entry.expiresAt > Date.now())) {
            clearTimeout(entry?.evictor);
            const fresh = { items: load(), expiresAt: Infinity };
            this.entries.set(sessionId, fresh);
            fresh.items.then(() => {
                fresh.expiresAt = Date.now() + this.ttlMs;
                if (this.entries.get(sessionId) === fresh) {
                    fresh.evictor = setTimeout(() => this.entries.delete(sessionId), this.ttlMs).unref();
                }
            }, () => {
                if (this.entries.get(sessionId) === fresh)
                    this.entries.delete(sessionId);
            });
            entry = fresh;
        }
        return [...(await entry.items)];
    }
    drop(sessionId) {
        clearTimeout(this.entries.get(sessionId)?.evictor);
        this.entries.delete(sessionId);
    }
}
exports.ListingMemo = ListingMemo;
//# sourceMappingURL=listing-memo.js.map