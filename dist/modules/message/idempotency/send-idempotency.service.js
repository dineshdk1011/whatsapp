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
exports.SendIdempotencyService = exports.SEND_IDEMPOTENCY_STALE_PENDING_MS = exports.SEND_IDEMPOTENCY_TTL_MS = void 0;
exports.isValidIdempotencyKey = isValidIdempotencyKey;
exports.hashSendRequest = hashSendRequest;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const crypto_1 = require("crypto");
const typeorm_2 = require("typeorm");
const send_idempotency_key_entity_1 = require("../entities/send-idempotency-key.entity");
const db_errors_1 = require("../../../common/utils/db-errors");
const logger_service_1 = require("../../../common/services/logger.service");
exports.SEND_IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;
exports.SEND_IDEMPOTENCY_STALE_PENDING_MS = 10 * 60 * 1000;
const PRUNE_INTERVAL_MS = 60 * 60 * 1000;
const KEY_PATTERN = /^[\x21-\x7E]{1,255}$/;
function isValidIdempotencyKey(key) {
    return KEY_PATTERN.test(key);
}
function canonicalJson(value) {
    if (value === null || typeof value !== 'object')
        return JSON.stringify(value) ?? 'null';
    if (Array.isArray(value))
        return `[${value.map(canonicalJson).join(',')}]`;
    const entries = Object.keys(value)
        .sort()
        .filter(k => value[k] !== undefined)
        .map(k => `${JSON.stringify(k)}:${canonicalJson(value[k])}`);
    return `{${entries.join(',')}}`;
}
function hashSendRequest(route, body) {
    return (0, crypto_1.createHash)('sha256')
        .update(route)
        .update('\n')
        .update(canonicalJson(body ?? null))
        .digest('hex');
}
let SendIdempotencyService = class SendIdempotencyService {
    keys;
    logger = (0, logger_service_1.createLogger)('SendIdempotency');
    pruneTimer = null;
    constructor(keys) {
        this.keys = keys;
    }
    onModuleInit() {
        this.pruneTimer = setInterval(() => void this.pruneExpired(), PRUNE_INTERVAL_MS);
        this.pruneTimer.unref?.();
    }
    onModuleDestroy() {
        if (this.pruneTimer)
            clearInterval(this.pruneTimer);
        this.pruneTimer = null;
    }
    async claim(input) {
        for (let round = 0; round < 2; round++) {
            const now = new Date();
            try {
                const result = await this.keys.insert({
                    sessionId: input.sessionId,
                    idempotencyKey: input.key,
                    route: input.route,
                    requestHash: input.requestHash,
                    state: 'pending',
                    expiresAt: new Date(now.getTime() + exports.SEND_IDEMPOTENCY_TTL_MS),
                });
                return { kind: 'claimed', id: result.identifiers[0].id };
            }
            catch (error) {
                if (!(0, db_errors_1.isUniqueViolation)(error))
                    throw error;
            }
            const existing = await this.keys.findOne({
                where: { sessionId: input.sessionId, idempotencyKey: input.key },
            });
            if (!existing)
                continue;
            if (existing.expiresAt.getTime() <= now.getTime()) {
                await this.keys.delete({ id: existing.id, expiresAt: (0, typeorm_2.LessThan)(now) });
                continue;
            }
            return this.classify(existing, input.requestHash, now);
        }
        return { kind: 'in_progress' };
    }
    classify(row, requestHash, now) {
        if (row.requestHash !== requestHash)
            return { kind: 'mismatch' };
        if (row.state === 'completed')
            return { kind: 'replay', body: row.responseBody };
        if (row.state === 'failed')
            return { kind: 'outcome_unknown' };
        const claimedAt = row.expiresAt.getTime() - exports.SEND_IDEMPOTENCY_TTL_MS;
        return now.getTime() - claimedAt > exports.SEND_IDEMPOTENCY_STALE_PENDING_MS
            ? { kind: 'outcome_unknown' }
            : { kind: 'in_progress' };
    }
    async complete(id, responseBody) {
        await this.keys.update({ id }, {
            state: 'completed',
            responseBody: responseBody ?? null,
        });
    }
    async release(id) {
        await this.keys.delete({ id, state: 'pending' });
    }
    async markFailed(id) {
        await this.keys.update({ id }, { state: 'failed' });
    }
    async pruneExpired(now = new Date()) {
        try {
            const { affected } = await this.keys.delete({ expiresAt: (0, typeorm_2.LessThan)(now) });
            if (affected) {
                this.logger.debug(`Pruned ${affected} expired send idempotency key(s)`, {
                    action: 'send_idempotency_prune',
                });
            }
            return affected ?? 0;
        }
        catch (error) {
            this.logger.warn('Send idempotency key prune failed', {
                error: error instanceof Error ? error.message : String(error),
                action: 'send_idempotency_prune_failed',
            });
            return 0;
        }
    }
};
exports.SendIdempotencyService = SendIdempotencyService;
exports.SendIdempotencyService = SendIdempotencyService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(send_idempotency_key_entity_1.SendIdempotencyKey, 'data')),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], SendIdempotencyService);
//# sourceMappingURL=send-idempotency.service.js.map