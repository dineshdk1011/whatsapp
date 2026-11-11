"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupMetadataCache = void 0;
exports.groupMetadataCacheTtlMs = groupMetadataCacheTtlMs;
const configuration_1 = require("../../config/configuration");
const DEFAULT_GROUP_METADATA_CACHE_TTL_MS = 5 * 60_000;
function groupMetadataCacheTtlMs() {
    return (0, configuration_1.resolveNonNegativeIntEnv)(process.env.BAILEYS_GROUP_METADATA_CACHE_TTL_MS, DEFAULT_GROUP_METADATA_CACHE_TTL_MS);
}
class GroupMetadataCache {
    ttlMs;
    maxEntries;
    now;
    entries = new Map();
    inFlight = new Map();
    expiryTimer;
    constructor(ttlMs, maxEntries = 256, now = Date.now) {
        this.ttlMs = ttlMs;
        this.maxEntries = maxEntries;
        this.now = now;
    }
    get enabled() {
        return this.ttlMs > 0;
    }
    get size() {
        return this.entries.size;
    }
    peek(jid) {
        const cached = this.entries.get(jid);
        if (!cached)
            return undefined;
        if (this.now() - cached.storedAt >= this.ttlMs) {
            this.entries.delete(jid);
            return undefined;
        }
        this.entries.delete(jid);
        this.entries.set(jid, cached);
        return cached.metadata;
    }
    read(jid, fetch) {
        if (!this.enabled)
            return Promise.resolve(undefined);
        const hit = this.peek(jid);
        if (hit)
            return Promise.resolve(hit);
        const joined = this.inFlight.get(jid);
        if (joined)
            return joined;
        const settle = () => {
            const held = this.inFlight.get(jid) === pending;
            if (held)
                this.inFlight.delete(jid);
            return held;
        };
        const pending = fetch().then(metadata => {
            if (settle())
                this.store(jid, metadata);
            return metadata;
        }, (error) => {
            settle();
            throw error;
        });
        this.inFlight.set(jid, pending);
        return pending;
    }
    invalidate(jid) {
        if (!jid)
            return;
        this.entries.delete(jid);
        this.inFlight.delete(jid);
    }
    clear() {
        this.entries.clear();
        this.inFlight.clear();
        clearTimeout(this.expiryTimer);
        this.expiryTimer = undefined;
    }
    applyUpdates(updates) {
        for (const update of updates ?? [])
            this.invalidate(update?.id);
    }
    store(jid, metadata) {
        this.entries.delete(jid);
        this.entries.set(jid, { metadata, storedAt: this.now() });
        while (this.entries.size > this.maxEntries) {
            const [oldest] = this.entries.keys();
            this.entries.delete(oldest);
        }
        this.scheduleExpiry();
    }
    scheduleExpiry() {
        if (this.expiryTimer)
            return;
        const dropExpired = () => {
            this.expiryTimer = undefined;
            const now = this.now();
            for (const [jid, cached] of this.entries) {
                if (now - cached.storedAt >= this.ttlMs)
                    this.entries.delete(jid);
            }
            if (this.entries.size > 0)
                this.scheduleExpiry();
        };
        this.expiryTimer = setTimeout(dropExpired, Math.min(this.ttlMs, configuration_1.MAX_TIMER_MS));
        this.expiryTimer.unref();
    }
}
exports.GroupMetadataCache = GroupMetadataCache;
//# sourceMappingURL=baileys-group-metadata-cache.js.map