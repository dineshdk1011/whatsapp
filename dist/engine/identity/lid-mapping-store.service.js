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
exports.LidMappingStoreService = exports.LID_MAPPING_CACHE_DEFAULT = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const lid_mapping_entity_1 = require("./lid-mapping.entity");
const wa_id_1 = require("./wa-id");
const logger_service_1 = require("../../common/services/logger.service");
const request_context_1 = require("../../common/services/request-context");
const configuration_1 = require("../../config/configuration");
exports.LID_MAPPING_CACHE_DEFAULT = 5000;
const LID_QUERY_CHUNK = 500;
const LID_WRITE_WARN_MS = 60_000;
const SECOND_LID_WINDOW_MS = 250;
const SECOND_LID_OWED_MAX = 10_000;
const SECOND_LID_REPORTED_MS = 10 * 60_000;
const SECOND_LID_REPORTED_MAX = 2000;
function setNewest(map, key, value, max) {
    map.delete(key);
    map.set(key, value);
    return map.size > max && map.delete(map.keys().next().value);
}
function chunk(items, size = LID_QUERY_CHUNK) {
    const out = [];
    for (let i = 0; i < items.length; i += size)
        out.push(items.slice(i, i + size));
    return out;
}
let LidMappingStoreService = class LidMappingStoreService {
    repo;
    logger = (0, logger_service_1.createLogger)('LidMappingStore');
    lidToPhone = new Map();
    unreported = new Set();
    phoneToLids = new Map();
    pendingLookups = new Set();
    absentFromTable = new Set();
    unsettledWrites = new Map();
    racedLookups = new Set();
    seenBy = new Map();
    failedWrites = new Set();
    writeWarning = { at: -Infinity, held: 0 };
    secondLidOwed = new Map();
    secondLidDropWarning = { at: -Infinity, held: 0 };
    secondLidReadWarning = { at: -Infinity, held: 0 };
    secondLidChecks = new Map();
    secondLidTimer;
    secondLidWindowMs = SECOND_LID_WINDOW_MS;
    secondLidReported = new Map();
    secondLidClosing = false;
    secondLidListener;
    now = () => performance.now();
    maxCachedLids;
    constructor(repo) {
        this.repo = repo;
        this.maxCachedLids = (0, configuration_1.resolveNonNegativeIntEnv)(process.env.LID_MAPPING_CACHE_MAX, exports.LID_MAPPING_CACHE_DEFAULT);
    }
    async onModuleInit() {
        await this.reload();
    }
    onModuleDestroy() {
        this.secondLidClosing = true;
        clearTimeout(this.secondLidTimer);
    }
    async reload() {
        this.absentFromTable.clear();
        try {
            const rows = await this.repo.find({
                order: { updatedAt: 'DESC' },
                take: this.maxCachedLids > 0 ? this.maxCachedLids : undefined,
            });
            this.lidToPhone.clear();
            this.unreported.clear();
            this.phoneToLids.clear();
            this.seenBy.clear();
            this.failedWrites.clear();
            for (const writing of this.unsettledWrites.values()) {
                delete writing.latestReport;
                delete writing.latestOperation;
            }
            this.absentFromTable.clear();
            for (const row of rows.reverse()) {
                this.index(row.lid, row.phone, row.sessionId, row.isReported);
            }
            this.logger.log(`Loaded ${rows.length} lid->phone mappings into cache${this.maxCachedLids ? ` (cap ${this.maxCachedLids})` : ''}`);
        }
        catch (err) {
            this.logger.warn(`Could not preload lid->phone mappings: ${err instanceof Error ? err.message : String(err)}`);
        }
    }
    getCached(lid) {
        if (this.lidToPhone.has(lid)) {
            const phone = this.lidToPhone.get(lid);
            this.lidToPhone.delete(lid);
            this.lidToPhone.set(lid, phone);
            return phone;
        }
        this.warmFromTable(lid);
        return undefined;
    }
    resolveLid(jid) {
        const lid = (0, wa_id_1.userPart)(jid);
        return this.unreported.has(lid) ? null : (this.getCached(lid) ?? null);
    }
    lidsForPhone(phone) {
        const set = this.phoneToLids.get(phone);
        return set ? [...set].filter(lid => !this.unreported.has(lid)) : [];
    }
    async findLidsForPhone(phone) {
        try {
            return (await this.readLidsForPhones([phone]))[phone];
        }
        catch (err) {
            this.logger.warn(`Could not read lids for a phone: ${err instanceof Error ? err.message : String(err)}`);
            return this.lidsForPhone(phone).filter(lid => !this.unreported.has(lid));
        }
    }
    async phonesForLidsPersisted(lids) {
        const out = {};
        if (lids.length === 0)
            return out;
        for (const lid of lids)
            out[lid] = this.unreported.has(lid) ? null : (this.lidToPhone.get(lid) ?? null);
        try {
            for (const batch of chunk(lids)) {
                const rows = await this.repo.find({ where: { lid: (0, typeorm_2.In)(batch) } });
                for (const lid of batch)
                    out[lid] = null;
                for (const row of rows)
                    out[row.lid] = this.rowPhone(row.lid, row.phone, row.isReported);
            }
        }
        catch {
        }
        return out;
    }
    async lidsForPhonesPersisted(phones) {
        try {
            return await this.readLidsForPhones(phones);
        }
        catch {
            return Object.fromEntries(phones.map(phone => [phone, this.lidsForPhone(phone).filter(lid => !this.unreported.has(lid))]));
        }
    }
    async readLidsForPhones(phones) {
        const out = Object.fromEntries(phones.map(phone => [phone, new Set()]));
        for (const batch of chunk(phones)) {
            for (const { lid, phone, isReported } of await this.repo.find({ where: { phone: (0, typeorm_2.In)(batch) } })) {
                if (!phone || !out[phone])
                    continue;
                if (this.rowPhone(lid, phone, isReported) === phone)
                    out[phone].add(lid);
            }
        }
        return Object.fromEntries(phones.map(phone => [phone, [...out[phone]]]));
    }
    unstored(lid) {
        return this.unsettledWrites.has(lid) || this.failedWrites.has(lid);
    }
    rowPhone(lid, phone, isReported = false) {
        if (!isReported || (this.unreported.has(lid) && this.unstored(lid)))
            return null;
        const cached = this.lidToPhone.get(lid);
        return this.unstored(lid) && cached !== undefined && cached !== phone ? null : phone;
    }
    async findPhoneForLid(jid) {
        const lid = (0, wa_id_1.userPart)(jid);
        try {
            const row = await this.repo.findOne({ where: { lid } });
            return row ? this.rowPhone(lid, row.phone, row.isReported) : null;
        }
        catch (err) {
            this.logger.warn(`Could not read the phone for a lid: ${err instanceof Error ? err.message : String(err)}`);
        }
        return this.unreported.has(lid) ? null : (this.getCached(lid) ?? null);
    }
    async rememberIfUnknown(lid, phone, sessionId) {
        if (!lid)
            return true;
        const cached = this.lidToPhone.get(lid);
        const lookup = { phone };
        if (cached && cached !== phone) {
            this.unreported.add(lid);
            this.seenBy.set(lid, new Set());
        }
        const reporters = this.seenBy.get(lid);
        const writing = this.beginWrite(lid, lookup);
        try {
            await this.repo
                .createQueryBuilder()
                .insert()
                .values({ lid, phone, sessionId: sessionId ?? null, updatedAt: new Date() })
                .orIgnore()
                .execute();
            const { affected } = await this.repo.update({ lid, phone: (0, typeorm_2.Raw)(column => `${column} <> :lookupPhone`, { lookupPhone: phone }), isReported: true }, { isReported: false, updatedAt: () => '"updatedAt"' });
            if (affected &&
                writing.latestOperation === lookup &&
                this.seenBy.get(lid) === reporters &&
                this.lidToPhone.has(lid))
                this.unreported.add(lid);
            this.absentFromTable.delete(lid);
            return true;
        }
        catch (err) {
            if (writing.latestOperation === lookup && this.seenBy.get(lid) === reporters && this.unreported.has(lid))
                this.failedWrites.add(lid);
            this.warnWriteFailed(`Could not store lid mapping: ${err instanceof Error ? err.message : String(err)}`);
            return false;
        }
        finally {
            this.endWrite(lid, writing);
        }
    }
    async remember(lid, phone, sessionId) {
        if (!lid)
            return true;
        const cached = this.lidToPhone.get(lid);
        const seen = !this.unreported.has(lid) &&
            cached === phone &&
            (phone === null || !sessionId || this.seenBy.get(lid)?.has(sessionId));
        const earlier = this.unsettledWrites.get(lid)?.check ?? this.secondLidOwed.get(lid);
        const gaining = phone !== null && (cached !== phone || this.unreported.has(lid) || (!!earlier && earlier.phone !== phone));
        const owed = gaining ? { phone, sessionId: sessionId ?? null, queued: false } : earlier;
        if (!seen && phone !== null)
            this.index(lid, phone, null);
        if (phone !== null)
            this.failedWrites.add(lid);
        const reporters = this.seenBy.get(lid);
        const report = { phone };
        const writing = this.beginWrite(lid, report, true);
        if (gaining) {
            writing.check = owed;
            this.secondLidOwed.delete(lid);
        }
        try {
            if (seen && phone !== null) {
                const changed = '"lid_mappings"."phone" IS NULL OR "lid_mappings"."phone" <> EXCLUDED."phone"';
                const [insert, parameters] = this.repo
                    .createQueryBuilder('lid_mappings')
                    .insert()
                    .values({ lid, phone, sessionId: sessionId ?? null, isReported: true, updatedAt: new Date() })
                    .getQueryAndParameters();
                await this.repo.query(insert +
                    ` ON CONFLICT ("lid") DO UPDATE SET "phone" = EXCLUDED."phone", "isReported" = true, ` +
                    `"sessionId" = CASE WHEN ${changed} THEN EXCLUDED."sessionId" ELSE "lid_mappings"."sessionId" END, ` +
                    `"updatedAt" = CASE WHEN ${changed} THEN EXCLUDED."updatedAt" ELSE "lid_mappings"."updatedAt" END ` +
                    `WHERE ${changed} OR "lid_mappings"."isReported" = false`, parameters);
            }
            else if (phone === null)
                await this.clear(lid, sessionId ?? null, seen, report);
            else {
                await this.repo.upsert({ lid, phone, sessionId: sessionId ?? null, isReported: true, updatedAt: new Date() }, [
                    'lid',
                ]);
            }
            if (phone !== null && reporters && this.seenBy.get(lid) === reporters) {
                const operation = writing.latestOperation;
                let reported = !this.unreported.has(lid);
                if (!reported && writing.latestReport === report && operation?.phone === phone) {
                    const row = await this.repo.findOne({ where: { lid } }).catch(() => null);
                    reported = row?.isReported === true && row.phone === phone;
                }
                if (reported &&
                    this.seenBy.get(lid) === reporters &&
                    writing.latestReport === report &&
                    writing.latestOperation === operation &&
                    operation?.phone === phone) {
                    this.failedWrites.delete(lid);
                    this.unreported.delete(lid);
                }
                if (sessionId && this.seenBy.get(lid) === reporters)
                    reporters.add(sessionId);
            }
            const again = writing.latestReport === report ? this.secondLidOwed.get(lid) : undefined;
            if (owed && owed.phone === phone)
                this.queueSecondLid(lid, owed);
            if (again?.phone === phone)
                this.queueSecondLid(lid, again);
            return true;
        }
        catch (err) {
            this.warnWriteFailed(`Failed to persist lid->phone mapping for ${lid}: ${err instanceof Error ? err.message : String(err)}`);
            return false;
        }
        finally {
            if (owed?.queued && writing.check === owed)
                writing.check = undefined;
            this.endWrite(lid, writing);
        }
    }
    beginWrite(lid, operation, actual = false) {
        const writing = this.unsettledWrites.get(lid) ?? { count: 0 };
        writing.count++;
        writing.latestOperation = operation;
        if (actual)
            writing.latestReport = operation;
        this.unsettledWrites.set(lid, writing);
        if (this.pendingLookups.has(lid))
            this.racedLookups.add(lid);
        return writing;
    }
    endWrite(lid, writing) {
        if (this.unsettledWrites.get(lid) !== writing || --writing.count > 0)
            return;
        this.unsettledWrites.delete(lid);
        if (writing.check && !writing.check.queued)
            this.oweSecondLid(lid, writing.check);
    }
    async clear(lid, sessionId, preserveEmpty, report) {
        const updatedAt = new Date();
        await this.repo
            .createQueryBuilder()
            .insert()
            .values({ lid, phone: null, sessionId, isReported: true, updatedAt })
            .orIgnore()
            .execute();
        const replaceable = [
            { lid, phone: (0, typeorm_2.IsNull)() },
            { lid, sessionId: (0, typeorm_2.IsNull)() },
            {
                lid,
                sessionId: (0, typeorm_2.Raw)(owner => `${owner} NOT IN (SELECT CAST(s."id" AS TEXT) FROM sessions s WHERE s."phone" IS NOT NULL)`),
            },
            ...(sessionId ? [{ lid, sessionId }] : []),
        ];
        const eligible = preserveEmpty
            ? replaceable.slice(1).map(where => ({ ...where, phone: (0, typeorm_2.Not)((0, typeorm_2.IsNull)()) }))
            : replaceable;
        const { affected } = await this.repo.update(eligible, { phone: null, sessionId, isReported: true, updatedAt });
        if (!affected || this.unsettledWrites.get(lid)?.latestReport !== report)
            return;
        const cached = this.lidToPhone.get(lid);
        this.lidToPhone.delete(lid);
        this.unreported.delete(lid);
        this.seenBy.delete(lid);
        this.failedWrites.delete(lid);
        if (cached)
            this.unindex(lid, cached);
        this.absentFromTable.delete(lid);
    }
    onSecondLid(listener) {
        this.secondLidListener = listener;
    }
    oweSecondLid(lid, check) {
        if (setNewest(this.secondLidOwed, lid, check, SECOND_LID_OWED_MAX)) {
            const message = `More than ${SECOND_LID_OWED_MAX} second-lid checks are owed; dropping the oldest`;
            this.warnAtMost(this.secondLidDropWarning, message, 'dropped');
        }
    }
    queueSecondLid(lid, check) {
        if (check.queued || this.secondLidClosing)
            return;
        check.queued = true;
        if (this.secondLidOwed.get(lid) === check)
            this.secondLidOwed.delete(lid);
        const lids = this.secondLidChecks.get(check.phone) ?? new Map();
        lids.set(lid, check);
        this.secondLidChecks.set(check.phone, lids);
        this.secondLidTimer ??= (0, request_context_1.outsideRequest)(() => setTimeout(() => void this.checkSecondLids(), this.secondLidWindowMs).unref());
    }
    get closed() {
        return this.secondLidClosing || this.repo.manager?.dataSource?.isInitialized === false;
    }
    async checkSecondLids() {
        this.secondLidTimer = undefined;
        const checks = this.secondLidChecks;
        this.secondLidChecks = new Map();
        if (this.closed)
            return;
        let found;
        try {
            found = await this.readLidsForPhones([...checks.keys()]);
        }
        catch (err) {
            for (const lids of checks.values())
                for (const [lid, check] of lids) {
                    const cached = this.lidToPhone.get(lid);
                    if (!this.secondLidOwed.has(lid) && (cached === undefined || cached === check.phone))
                        this.oweSecondLid(lid, { ...check, queued: false });
                }
            const message = `Could not check for a second lid: ${err instanceof Error ? err.message : String(err)}`;
            setTimeout(() => this.closed || this.warnAtMost(this.secondLidReadWarning, message, 'failed'), this.secondLidWindowMs).unref();
            return;
        }
        if (this.closed)
            return;
        for (const [phone, lids] of checks) {
            const queued = [...lids.keys()];
            const held = found[phone] ?? [];
            queued.forEach((newLid, i) => {
                if (!held.includes(newLid)) {
                    const check = lids.get(newLid);
                    if (check && this.lidToPhone.get(newLid) === phone && !this.secondLidOwed.has(newLid))
                        this.oweSecondLid(newLid, { ...check, queued: false });
                    return;
                }
                for (const previousLid of held) {
                    if (queued.indexOf(previousLid) >= i || !this.firstReport(phone, previousLid, newLid))
                        continue;
                    this.reportSecondLid({ phone, previousLid, newLid, sessionId: lids.get(newLid)?.sessionId ?? null });
                }
            });
        }
    }
    firstReport(phone, a, b) {
        const key = [phone, ...[a, b].sort()].join(':');
        const now = this.now();
        if (now - (this.secondLidReported.get(key) ?? -Infinity) < SECOND_LID_REPORTED_MS)
            return false;
        setNewest(this.secondLidReported, key, now, SECOND_LID_REPORTED_MAX);
        return true;
    }
    reportSecondLid(report) {
        const { phone, previousLid, newLid, sessionId } = report;
        this.logger.warn('A phone number was reported under a second privacy id', {
            sessionId: sessionId ?? undefined,
            phone,
            previousLid,
            newLid,
            action: 'second_lid_reported',
        });
        const listener = this.secondLidListener;
        if (listener) {
            void Promise.resolve()
                .then(() => listener(report))
                .catch(err => this.logger.warn(`Could not report a second lid: ${err instanceof Error ? err.message : String(err)}`));
        }
    }
    warnWriteFailed(message) {
        this.warnAtMost(this.writeWarning, message, 'failed');
    }
    warnAtMost(gate, message, verb) {
        const now = this.now();
        if (now - gate.at < LID_WRITE_WARN_MS) {
            gate.held++;
            return;
        }
        this.logger.warn(gate.held ? `${message} (${gate.held} more ${verb} since the last warning)` : message);
        gate.at = now;
        gate.held = 0;
    }
    async releaseSession(sessionId) {
        this.seenBy.clear();
        try {
            await this.repo.update({ sessionId }, { sessionId: null, updatedAt: () => '"updatedAt"' });
        }
        catch (err) {
            this.logger.warn(`Could not release lid mappings: ${err instanceof Error ? err.message : String(err)}`);
        }
    }
    warmFromTable(lid) {
        if (!lid || this.pendingLookups.has(lid) || this.absentFromTable.has(lid))
            return;
        this.pendingLookups.add(lid);
        const writeInFlight = this.unsettledWrites.has(lid);
        void this.repo
            .findOne({ where: { lid } })
            .then(row => {
            if (writeInFlight || this.racedLookups.has(lid))
                return;
            if (row && !this.lidToPhone.has(row.lid)) {
                this.index(row.lid, row.phone, row.sessionId, row.isReported);
                return;
            }
            if (!row && !this.lidToPhone.has(lid))
                this.noteAbsent(lid);
        })
            .catch(() => undefined)
            .finally(() => {
            this.pendingLookups.delete(lid);
            this.racedLookups.delete(lid);
        });
    }
    index(lid, phone, sessionId, isReported = true) {
        const previouslyReported = !this.unreported.has(lid);
        if (isReported)
            this.unreported.delete(lid);
        else
            this.unreported.add(lid);
        const prev = this.lidToPhone.get(lid);
        if (prev && prev !== phone) {
            this.unindex(lid, prev);
        }
        const seen = (isReported && previouslyReported && prev === phone && this.seenBy.get(lid)) || new Set();
        if (isReported && sessionId)
            seen.add(sessionId);
        if (phone)
            this.seenBy.set(lid, seen);
        else
            this.seenBy.delete(lid);
        this.lidToPhone.delete(lid);
        this.lidToPhone.set(lid, phone);
        if (phone) {
            const set = this.phoneToLids.get(phone) ?? new Set();
            set.add(lid);
            this.phoneToLids.set(phone, set);
        }
        this.absentFromTable.delete(lid);
        this.evictIfOverCap();
    }
    noteAbsent(lid) {
        if (!this.maxCachedLids)
            return;
        this.absentFromTable.add(lid);
        while (this.absentFromTable.size > this.maxCachedLids) {
            const oldest = this.absentFromTable.values().next().value;
            if (oldest === undefined)
                break;
            this.absentFromTable.delete(oldest);
        }
    }
    evictIfOverCap() {
        if (!this.maxCachedLids)
            return;
        while (this.lidToPhone.size > this.maxCachedLids) {
            const oldest = this.lidToPhone.keys().next().value;
            if (oldest === undefined)
                break;
            const phone = this.lidToPhone.get(oldest);
            this.lidToPhone.delete(oldest);
            this.unreported.delete(oldest);
            this.seenBy.delete(oldest);
            this.failedWrites.delete(oldest);
            const writing = this.unsettledWrites.get(oldest);
            if (writing) {
                delete writing.latestReport;
                delete writing.latestOperation;
            }
            if (phone)
                this.unindex(oldest, phone);
        }
    }
    unindex(lid, phone) {
        const set = this.phoneToLids.get(phone);
        if (set?.delete(lid) && set.size === 0)
            this.phoneToLids.delete(phone);
    }
};
exports.LidMappingStoreService = LidMappingStoreService;
exports.LidMappingStoreService = LidMappingStoreService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(lid_mapping_entity_1.LidMapping, 'data')),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], LidMappingStoreService);
//# sourceMappingURL=lid-mapping-store.service.js.map