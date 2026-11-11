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
exports.StatusStoreService = exports.DEFAULT_MEDIA_MAX_BYTES = exports.STATUS_TTL_MS = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const typeorm_2 = require("typeorm");
const crypto_1 = require("crypto");
const status_update_entity_1 = require("./entities/status-update.entity");
const storage_service_1 = require("../../common/storage/storage.service");
const orphan_sweep_1 = require("../../common/storage/orphan-sweep");
const guarded_interval_1 = require("../../common/utils/guarded-interval");
const mime_ext_1 = require("../../common/media/mime-ext");
const db_errors_1 = require("../../common/utils/db-errors");
const lid_mapping_store_service_1 = require("../../engine/identity/lid-mapping-store.service");
const wa_id_1 = require("../../engine/identity/wa-id");
const logger_service_1 = require("../../common/services/logger.service");
const session_write_scope_1 = require("../../common/utils/session-write-scope");
exports.STATUS_TTL_MS = 24 * 60 * 60 * 1000;
const PURGE_INTERVAL_MS = 15 * 60 * 1000;
const PURGE_BATCH_SIZE = 500;
const PURGE_MAX_BATCHES_PER_RUN = 200;
exports.DEFAULT_MEDIA_MAX_BYTES = 10 * 1024 * 1024;
const DEFAULT_ORPHAN_SWEEP_INTERVAL_MS = 60 * 60 * 1000;
const DEFAULT_ORPHAN_GRACE_MS = 60 * 60 * 1000;
const STATUS_MEDIA_PREFIX = 'statuses/';
let StatusStoreService = class StatusStoreService {
    repository;
    storageService;
    configService;
    lidMappingStore;
    logger = (0, logger_service_1.createLogger)('StatusStoreService');
    stopMaintenance = [];
    orphanFirstSeenAt = new Map();
    purgeCursor;
    constructor(repository, storageService, configService, lidMappingStore) {
        this.repository = repository;
        this.storageService = storageService;
        this.configService = configService;
        this.lidMappingStore = lidMappingStore;
    }
    onModuleInit() {
        const failed = (what) => (err) => this.logger.error(`${what} failed`, err instanceof Error ? err.stack : String(err));
        const sweepIntervalMs = this.configService.get('status.orphanSweepIntervalMs', DEFAULT_ORPHAN_SWEEP_INTERVAL_MS);
        this.stopMaintenance = [
            (0, guarded_interval_1.startGuardedInterval)(() => this.purgeExpired(Date.now()), PURGE_INTERVAL_MS, failed('Status purge')),
            (0, guarded_interval_1.startGuardedInterval)(() => this.sweepOrphanedMedia(Date.now()), sweepIntervalMs, failed('Status media orphan sweep')),
        ];
    }
    onModuleDestroy() {
        for (const stop of this.stopMaintenance)
            stop();
        this.stopMaintenance = [];
    }
    async ingest(sessionId, s, lifetime) {
        const scope = lifetime ?? this.captureWrites(sessionId);
        try {
            const existing = await this.repository.findOne({ where: { sessionId, waStatusId: s.waStatusId } });
            if (existing)
                return { row: existing, created: false };
            const row = new status_update_entity_1.StatusUpdate();
            row.sessionId = sessionId;
            row.contactJid = s.contactJid;
            row.contactName = s.contactName;
            row.contactPushName = s.contactPushName;
            row.waStatusId = s.waStatusId;
            row.type = s.type;
            row.caption = s.caption;
            row.backgroundColor = s.backgroundColor;
            row.font = s.font;
            row.postedAt = s.postedAt;
            row.expiresAt = s.postedAt + exports.STATUS_TTL_MS;
            const keepMedia = this.applyMediaDecision(row, s);
            let saved;
            try {
                saved = await scope.write(() => this.repository.save(row, { transaction: false }));
            }
            catch (error) {
                const winner = await this.repository.findOne({ where: { sessionId, waStatusId: s.waStatusId } });
                if (winner && (0, db_errors_1.isUniqueViolation)(error))
                    return { row: winner, created: false };
                throw error;
            }
            if (keepMedia && !(await this.attachMedia(saved, sessionId, s)))
                return { row: saved, created: false };
            return { row: saved, created: true };
        }
        finally {
            if (!lifetime)
                scope.close();
        }
    }
    captureWrites(sessionId) {
        return (0, session_write_scope_1.captureSessionWrites)(this.repository.manager?.connection ?? this.repository, sessionId);
    }
    applyMediaDecision(row, s) {
        const media = s.media;
        if (!media) {
            row.mediaOmitted = false;
            return false;
        }
        const maxBytes = this.configService.get('status.mediaMaxBytes', exports.DEFAULT_MEDIA_MAX_BYTES);
        const sizeBytes = media.sizeBytes ?? (media.data ? Buffer.byteLength(media.data, 'base64') : undefined);
        const withinCap = sizeBytes !== undefined && sizeBytes <= maxBytes;
        if (!media.omitted && media.data && withinCap) {
            row.mediaOmitted = true;
            return true;
        }
        row.mediaOmitted = true;
        row.omitReason =
            sizeBytes !== undefined && sizeBytes > maxBytes ? 'over_cap' : media.omitted ? 'engine_omitted' : 'over_cap';
        return false;
    }
    async attachMedia(row, sessionId, s) {
        const media = s.media;
        if (!media?.data)
            return true;
        const key = `${STATUS_MEDIA_PREFIX}${sessionId}/${(0, crypto_1.randomUUID)()}.${(0, mime_ext_1.extFromMimetype)(media.mimetype)}`;
        try {
            await this.storageService.putFile(key, Buffer.from(media.data, 'base64'));
        }
        catch (error) {
            this.logger.error(`Failed to persist status media for session ${sessionId}, status ${s.waStatusId}`, error instanceof Error ? error.stack : String(error));
            row.omitReason = 'write_failed';
            await this.repository.update({ id: row.id, sessionId }, { omitReason: row.omitReason }).catch(err => this.logger.warn(`Failed to record the write_failed omission for status ${s.waStatusId}`, {
                error: String(err),
            }));
            return true;
        }
        row.mediaPath = key;
        row.mediaMimetype = media.mimetype;
        row.mediaOmitted = false;
        try {
            const result = await this.repository.update({ id: row.id, sessionId }, {
                mediaPath: row.mediaPath,
                mediaMimetype: row.mediaMimetype,
                mediaOmitted: false,
            });
            if (result.affected === 0) {
                row.mediaPath = undefined;
                row.mediaMimetype = undefined;
                row.mediaOmitted = true;
                await this.storageService.deleteFile(key).catch(() => undefined);
                return false;
            }
        }
        catch (error) {
            this.logger.warn(`Status media ${key} written but the row update failed; leaving it for the orphan sweep`, {
                error: String(error),
            });
            row.mediaPath = undefined;
            row.mediaMimetype = undefined;
            row.mediaOmitted = true;
            row.omitReason = 'write_failed';
        }
        return true;
    }
    async list(sessionId) {
        const rows = await this.repository.find({
            where: { sessionId, expiresAt: (0, typeorm_2.MoreThan)(Date.now()) },
            order: { postedAt: 'DESC' },
        });
        return rows.map(row => this.toStatus(row));
    }
    async listByContact(sessionId, contactJid) {
        const candidates = new Set([contactJid]);
        if (this.lidMappingStore) {
            const parsed = (0, wa_id_1.parseWaId)(contactJid);
            if (parsed.kind === 'lid') {
                candidates.add(`${parsed.userPart}@lid`);
                const resolved = await this.lidMappingStore.findPhoneForLid(parsed.userPart);
                if (resolved)
                    candidates.add(`${resolved}@c.us`);
            }
            else {
                const phone = (0, wa_id_1.userPart)(contactJid);
                candidates.add(`${phone}@c.us`);
                for (const lid of await this.lidMappingStore.findLidsForPhone(phone))
                    candidates.add(`${lid}@lid`);
            }
        }
        const rows = await this.repository.find({
            where: { sessionId, contactJid: (0, typeorm_2.In)([...candidates]), expiresAt: (0, typeorm_2.MoreThan)(Date.now()) },
            order: { postedAt: 'DESC' },
        });
        return rows.map(row => this.toStatus(row));
    }
    canonicalContactJid(jid) {
        if (!jid.endsWith('@lid'))
            return jid;
        const phone = this.lidMappingStore?.resolveLid(jid);
        return phone ? `${phone}@c.us` : jid;
    }
    toStatus(row) {
        return {
            id: row.waStatusId,
            contact: {
                id: this.canonicalContactJid(row.contactJid),
                name: row.contactName ?? undefined,
                pushName: row.contactPushName ?? undefined,
            },
            type: row.type,
            caption: row.caption ?? undefined,
            mediaUrl: row.mediaPath && !row.mediaOmitted
                ? `/api/sessions/${row.sessionId}/status/${row.waStatusId}/media`
                : undefined,
            backgroundColor: row.backgroundColor ?? undefined,
            font: row.font ?? undefined,
            timestamp: new Date(row.postedAt),
            expiresAt: new Date(row.expiresAt),
        };
    }
    async getMedia(sessionId, statusId) {
        const row = await this.repository.findOne({
            where: { sessionId, waStatusId: statusId, expiresAt: (0, typeorm_2.MoreThan)(Date.now()) },
        });
        if (!row || row.mediaOmitted || !row.mediaPath)
            return null;
        return { path: row.mediaPath, mimetype: row.mediaMimetype || 'application/octet-stream' };
    }
    async purgeExpired(now) {
        let removed = 0;
        let after = this.purgeCursor;
        this.purgeCursor = undefined;
        for (let batch = 0; batch < PURGE_MAX_BATCHES_PER_RUN; batch++) {
            const expired = await this.repository.find({
                where: { expiresAt: (0, typeorm_2.LessThan)(now), ...(after ? { id: (0, typeorm_2.MoreThan)(after) } : {}) },
                select: { id: true, mediaPath: true },
                order: { id: 'ASC' },
                take: PURGE_BATCH_SIZE,
            });
            if (expired.length === 0)
                break;
            after = expired[expired.length - 1].id;
            const deletableIds = [];
            for (const row of expired) {
                try {
                    if (row.mediaPath)
                        await this.storageService.deleteFile(row.mediaPath);
                    deletableIds.push(row.id);
                }
                catch (err) {
                    this.logger.warn(`Failed to delete expired status media ${row.mediaPath}; keeping the row for the next sweep`, { error: String(err) });
                }
            }
            if (deletableIds.length === 0) {
                this.purgeCursor = after;
                break;
            }
            const result = await this.repository.delete(deletableIds);
            removed += result.affected ?? deletableIds.length;
            if (expired.length < PURGE_BATCH_SIZE)
                break;
            if (batch === PURGE_MAX_BATCHES_PER_RUN - 1)
                this.purgeCursor = after;
        }
        return removed;
    }
    async sweepOrphanedMedia(now = Date.now()) {
        const graceMs = this.configService.get('status.orphanGraceMs', DEFAULT_ORPHAN_GRACE_MS);
        const removed = await (0, orphan_sweep_1.sweepOrphanedFiles)({
            storage: this.storageService,
            prefix: STATUS_MEDIA_PREFIX,
            graceMs,
            now,
            firstSeenAt: this.orphanFirstSeenAt,
            referencedAmong: async () => {
                const rows = await this.repository.find({
                    where: { mediaPath: (0, typeorm_2.Not)((0, typeorm_2.IsNull)()) },
                    select: { mediaPath: true },
                });
                return new Set(rows.map(row => row.mediaPath));
            },
            onDeleteFailed: (file, err) => this.logger.warn(`Failed to delete orphaned status media ${file}`, { error: String(err) }),
        });
        if (removed > 0)
            this.logger.log(`Status media orphan sweep removed ${removed} file(s)`);
        return removed;
    }
};
exports.StatusStoreService = StatusStoreService;
exports.StatusStoreService = StatusStoreService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(status_update_entity_1.StatusUpdate, 'data')),
    __param(3, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        storage_service_1.StorageService,
        config_1.ConfigService,
        lid_mapping_store_service_1.LidMappingStoreService])
], StatusStoreService);
//# sourceMappingURL=status-store.service.js.map