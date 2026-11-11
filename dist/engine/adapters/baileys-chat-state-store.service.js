"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatStateStoreService = exports.CHAT_STATE_CACHE_DEFAULT = void 0;
exports.mergeTwinStates = mergeTwinStates;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const baileys_chat_state_entity_1 = require("./baileys-chat-state.entity");
const logger_service_1 = require("../../common/services/logger.service");
const configuration_1 = require("../../config/configuration");
const keyed_mutation_queue_1 = require("../../common/utils/keyed-mutation-queue");
const FIELDS = ['muteEndTime', 'archived', 'pinned', 'deletedAt'];
const DEFAULT_STATE = { muteEndTime: null, archived: false, pinned: false, deletedAt: null };
const valueOf = (v, field) => v[field] ?? DEFAULT_STATE[field];
function fromRow(row) {
    return {
        muteEndTime: row.muteEndTime,
        archived: row.archived,
        pinned: row.pinned,
        deletedAt: row.deletedAt ?? null,
        updatedAt: row.updatedAt?.getTime(),
        observed: row.observed == null ? undefined : row.observed.split(',').filter(Boolean),
    };
}
const saw = (v, field) => v.observed ? v.observed.includes(field) : valueOf(v, field) !== DEFAULT_STATE[field];
function mergeTwinStates(rows) {
    if (!rows.length)
        return undefined;
    const sorted = [...rows].sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
    const out = { ...sorted[0] };
    for (const field of FIELDS) {
        const from = sorted.find(r => saw(r, field));
        if (from)
            Object.assign(out, { [field]: from[field] });
    }
    out.observed = FIELDS.filter(f => sorted.some(r => saw(r, f)));
    return out;
}
const SEP = '\u0000';
exports.CHAT_STATE_CACHE_DEFAULT = 5000;
let ChatStateStoreService = class ChatStateStoreService {
    repo;
    logger = (0, logger_service_1.createLogger)('ChatStateStore');
    states = new Map();
    pendingLookups = new Set();
    absent = new Set();
    completeSessions = new Set();
    writeSeq = 0;
    sessionWrites = new Map();
    warnedEviction = false;
    maxEntries;
    writes = new keyed_mutation_queue_1.KeyedMutationQueue();
    inFlight = new Map();
    touchSeq = 0;
    touchedFloor = 0;
    touched = new Map();
    lastStamp = 0;
    constructor(repo) {
        this.repo = repo;
        this.maxEntries = (0, configuration_1.resolveNonNegativeIntEnv)(process.env.BAILEYS_CHAT_STATE_CACHE_MAX, exports.CHAT_STATE_CACHE_DEFAULT);
    }
    async onModuleInit() {
        await this.reload();
    }
    async reload() {
        const seq = this.writeSeq;
        const idle = this.writes.size === 0;
        const since = this.touchSeq;
        this.completeSessions.clear();
        this.absent.clear();
        try {
            const rows = await this.repo.find({
                order: { updatedAt: 'DESC' },
                take: this.maxEntries > 0 ? this.maxEntries : undefined,
            });
            this.states.clear();
            this.absent.clear();
            this.completeSessions.clear();
            let skipped = false;
            for (const row of [...rows].reverse()) {
                const k = this.key(row.sessionId, row.chatId);
                if (this.changedSince(k, since))
                    skipped = true;
                else
                    this.index(k, fromRow(row));
            }
            if (this.loadWasWhole(rows.length, idle && this.writeSeq === seq && this.writes.size === 0 && !skipped)) {
                for (const row of rows)
                    this.completeSessions.add(row.sessionId);
            }
            this.logger.log(`Loaded ${rows.length} chat states into cache${this.maxEntries ? ` (cap ${this.maxEntries})` : ''}`);
        }
        catch (err) {
            this.logger.warn(`Could not preload chat states: ${err instanceof Error ? err.message : String(err)}`);
        }
    }
    get(sessionId, chatId) {
        const k = this.key(sessionId, chatId);
        if (this.states.has(k)) {
            const value = this.states.get(k);
            this.states.delete(k);
            this.states.set(k, value);
            return value;
        }
        if (!this.completeSessions.has(sessionId) && !this.absent.has(k))
            this.warmFromTable(k, sessionId, chatId);
        return undefined;
    }
    chatIds(sessionId) {
        const prefix = `${sessionId}${SEP}`;
        return [...this.states.keys()].filter(k => k.startsWith(prefix)).map(k => k.slice(prefix.length));
    }
    remember(sessionId, chatId, patch, create = true) {
        const k = this.key(sessionId, chatId);
        const generation = this.writesOf(sessionId).generation;
        return this.enqueue(sessionId, [k], async () => {
            await this.applyPatch(k, sessionId, chatId, patch, generation, create);
        });
    }
    fold(sessionId, chatId, twins, patch, create = true) {
        const k = this.key(sessionId, chatId);
        const generation = this.writesOf(sessionId).generation;
        const keys = [...new Set([k, ...twins.map(twin => this.key(sessionId, twin))])];
        return this.enqueue(sessionId, keys, () => this.applyFold(k, sessionId, chatId, twins, patch, generation, create));
    }
    enqueue(sessionId, keys, work) {
        const { pending } = this.writesOf(sessionId);
        let release;
        const held = new Promise(resolve => (release = resolve));
        const turns = keys.map(k => {
            this.inFlight.set(k, (this.inFlight.get(k) ?? 0) + 1);
            return new Promise(turn => this.writes.enqueue(k, () => {
                turn();
                return held;
            }));
        });
        const done = Promise.all(turns).then(() => work().finally(() => {
            for (const k of keys)
                this.settled(k);
            release();
        }));
        pending.add(done);
        const settle = () => pending.delete(done);
        done.then(settle, settle);
        return done;
    }
    stamp() {
        const now = Date.now();
        this.lastStamp = this.lastStamp - now > 60_000 ? now : Math.max(now, this.lastStamp + 1);
        return new Date(this.lastStamp);
    }
    writesOf(sessionId) {
        let writes = this.sessionWrites.get(sessionId);
        if (!writes) {
            writes = { pending: new Set(), seq: 0, generation: 0 };
            this.sessionWrites.set(sessionId, writes);
        }
        return writes;
    }
    cleared(sessionId, generation) {
        return this.writesOf(sessionId).generation !== generation;
    }
    bumpWriteSeq(sessionId) {
        this.writeSeq++;
        this.writesOf(sessionId).seq++;
    }
    settled(k) {
        const left = (this.inFlight.get(k) ?? 1) - 1;
        if (left > 0)
            this.inFlight.set(k, left);
        else
            this.inFlight.delete(k);
        this.touch(k);
    }
    touch(key) {
        if (this.maxEntries && this.touched.size >= this.maxEntries) {
            this.touched.clear();
            this.touchedFloor = this.touchSeq;
        }
        this.touched.set(key, ++this.touchSeq);
    }
    changedSince(k, since) {
        if (this.inFlight.has(k))
            return true;
        const last = (key) => this.touched.get(key) ?? this.touchedFloor;
        return last(k) > since || last(k.slice(0, k.indexOf(SEP) + 1)) > since;
    }
    async applyFold(k, sessionId, chatId, twins, patch, generation, create) {
        const rows = [];
        const found = [];
        try {
            const own = await this.peek(k, sessionId, chatId);
            if (own)
                rows.push(own);
            for (const twin of twins) {
                const v = await this.peek(this.key(sessionId, twin), sessionId, twin);
                if (!v)
                    continue;
                found.push(twin);
                rows.push(v);
            }
        }
        catch {
            await this.applyPatch(k, sessionId, chatId, patch, generation, create);
            return;
        }
        if (!found.length) {
            await this.applyPatch(k, sessionId, chatId, patch, generation, create);
            return;
        }
        const merged = mergeTwinStates(rows);
        const base = Object.fromEntries(FIELDS.filter(f => saw(merged, f)).map(f => [f, merged[f]]));
        if (await this.applyPatch(k, sessionId, chatId, { ...base, ...patch }, generation)) {
            await Promise.all(found.map(twin => {
                const tk = this.key(sessionId, twin);
                this.states.delete(tk);
                this.markAbsent(tk);
                return this.drop(sessionId, twin);
            }));
        }
    }
    async peek(k, sessionId, chatId) {
        const cached = this.states.get(k);
        if (cached || this.completeSessions.has(sessionId) || this.absent.has(k))
            return cached;
        const row = await this.repo.findOne({ where: { sessionId, chatId } });
        if (!row && !this.states.has(k))
            this.markAbsent(k);
        return row ? fromRow(row) : undefined;
    }
    async applyPatch(k, sessionId, chatId, patch, generation, create = true) {
        if (this.cleared(sessionId, generation))
            return false;
        let existing = this.states.get(k);
        if (!existing) {
            const restatesDefaults = !create && FIELDS.every(f => !Object.hasOwn(patch, f) || valueOf(patch, f) === DEFAULT_STATE[f]);
            if (restatesDefaults && (this.completeSessions.has(sessionId) || this.absent.has(k)))
                return true;
            let row;
            try {
                row = await this.repo.findOne({ where: { sessionId, chatId } });
            }
            catch {
                if (this.cleared(sessionId, generation))
                    return false;
                this.bumpWriteSeq(sessionId);
                this.completeSessions.delete(sessionId);
                const ok = await this.persistBlind(sessionId, chatId, patch, !restatesDefaults);
                this.absent.delete(k);
                return ok;
            }
            if (this.cleared(sessionId, generation))
                return false;
            if (!row && restatesDefaults) {
                this.markAbsent(k);
                return true;
            }
            existing = row ? fromRow(row) : { ...DEFAULT_STATE, observed: [] };
        }
        const existingRow = existing;
        const observed = FIELDS.filter(f => saw(existingRow, f) || Object.hasOwn(patch, f));
        const next = { ...existing, ...patch, updatedAt: existing.updatedAt, observed };
        if (FIELDS.every(f => valueOf(existingRow, f) === valueOf(next, f) && saw(existingRow, f) === observed.includes(f))) {
            this.index(k, next);
            return true;
        }
        const at = this.stamp();
        next.updatedAt = at.getTime();
        this.bumpWriteSeq(sessionId);
        this.index(k, next);
        const persisted = await this.persist(sessionId, chatId, next, at);
        if (!persisted) {
            this.states.delete(k);
            this.completeSessions.delete(sessionId);
        }
        return persisted;
    }
    async persist(sessionId, chatId, values, at) {
        const columns = { ...values, observed: values.observed?.join(',') };
        delete columns.updatedAt;
        try {
            await this.repo.upsert({ sessionId, chatId, ...columns, updatedAt: at }, ['sessionId', 'chatId']);
            return true;
        }
        catch (err) {
            this.logger.warn(`Failed to persist chat state for ${chatId}: ${err instanceof Error ? err.message : String(err)}`);
            return false;
        }
    }
    async persistBlind(sessionId, chatId, patch, create) {
        const carried = FIELDS.filter(f => Object.hasOwn(patch, f));
        const columns = Object.fromEntries(carried.map(f => [f, patch[f]]));
        const updatedAt = this.stamp();
        try {
            if (create) {
                await this.repo
                    .createQueryBuilder()
                    .insert()
                    .values({ sessionId, chatId, ...columns, observed: carried.join(','), updatedAt })
                    .orIgnore()
                    .execute();
            }
            await this.repo.update({ sessionId, chatId }, { ...columns, updatedAt });
            return true;
        }
        catch (err) {
            this.logger.warn(`Failed to persist chat state for ${chatId}: ${err instanceof Error ? err.message : String(err)}`);
            return false;
        }
    }
    async clearSession(sessionId) {
        const writes = this.writesOf(sessionId);
        writes.generation++;
        await Promise.allSettled([...writes.pending]);
        await this.repo.delete({ sessionId });
        const prefix = `${sessionId}${SEP}`;
        for (const k of [...this.states.keys()]) {
            if (k.startsWith(prefix))
                this.states.delete(k);
        }
        this.touch(prefix);
    }
    async forget(sessionId, chatIds) {
        await Promise.all(chatIds.map(chatId => {
            const k = this.key(sessionId, chatId);
            this.states.delete(k);
            this.markAbsent(k);
            return this.enqueue(sessionId, [k], () => this.drop(sessionId, chatId));
        }));
    }
    async drop(sessionId, chatId) {
        const k = this.key(sessionId, chatId);
        try {
            await this.repo.delete({ sessionId, chatId });
            this.markAbsent(k);
        }
        catch (err) {
            this.logger.warn(`Failed to forget chat state for ${chatId}: ${err instanceof Error ? err.message : String(err)}`);
        }
        this.states.delete(k);
    }
    async refreshSession(sessionId) {
        const prefix = `${sessionId}${SEP}`;
        const writes = this.writesOf(sessionId);
        const seq = writes.seq;
        const idle = writes.pending.size === 0;
        const since = this.touchSeq;
        this.completeSessions.delete(sessionId);
        let rows;
        try {
            rows = await this.repo.find({
                where: { sessionId },
                order: { updatedAt: 'DESC' },
                take: this.maxEntries > 0 ? this.maxEntries : undefined,
            });
        }
        catch (err) {
            this.logger.warn(`Could not refresh chat states for ${sessionId}: ${err instanceof Error ? err.message : String(err)}`);
        }
        for (const k of [...this.absent]) {
            if (k.startsWith(prefix))
                this.absent.delete(k);
        }
        if (!rows)
            return;
        this.completeSessions.delete(sessionId);
        for (const k of [...this.states.keys()]) {
            if (k.startsWith(prefix))
                this.states.delete(k);
        }
        let skipped = false;
        for (const row of [...rows].reverse()) {
            const k = this.key(sessionId, row.chatId);
            if (this.changedSince(k, since))
                skipped = true;
            else
                this.index(k, fromRow(row));
        }
        if (this.loadWasWhole(rows.length, idle && writes.seq === seq && writes.pending.size === 0 && !skipped)) {
            this.completeSessions.add(sessionId);
        }
    }
    loadWasWhole(count, quiet) {
        return quiet && (this.maxEntries === 0 || count < this.maxEntries);
    }
    warmFromTable(k, sessionId, chatId) {
        if (this.pendingLookups.has(k))
            return;
        this.pendingLookups.add(k);
        const since = this.touchSeq;
        void this.repo
            .findOne({ where: { sessionId, chatId } })
            .then(row => {
            if (this.states.has(k) || this.changedSince(k, since))
                return;
            if (row)
                this.index(k, fromRow(row));
            else
                this.markAbsent(k);
        })
            .catch(() => undefined)
            .finally(() => this.pendingLookups.delete(k));
    }
    markAbsent(k) {
        this.absent.add(k);
        if (this.maxEntries && this.absent.size > this.maxEntries) {
            this.absent.delete(this.absent.values().next().value);
        }
    }
    index(k, value) {
        this.absent.delete(k);
        this.states.delete(k);
        this.states.set(k, value);
        this.evictIfOverCap();
    }
    evictIfOverCap() {
        if (!this.maxEntries)
            return;
        while (this.states.size > this.maxEntries) {
            const oldest = this.states.keys().next().value;
            if (oldest === undefined)
                break;
            this.states.delete(oldest);
            this.completeSessions.delete(oldest.slice(0, oldest.indexOf(SEP)));
            if (!this.warnedEviction) {
                this.warnedEviction = true;
                this.logger.warn(`Chat state cache is full (${this.maxEntries}); raise BAILEYS_CHAT_STATE_CACHE_MAX so pin, mute and archive stay cached`);
            }
        }
    }
    key(sessionId, chatId) {
        return `${sessionId}${SEP}${chatId}`;
    }
};
exports.ChatStateStoreService = ChatStateStoreService;
exports.ChatStateStoreService = ChatStateStoreService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(baileys_chat_state_entity_1.ChatState, 'data')),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ChatStateStoreService);
//# sourceMappingURL=baileys-chat-state-store.service.js.map