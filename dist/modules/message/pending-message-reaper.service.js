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
exports.PendingMessageReaperService = void 0;
exports.resolvePendingMessageReaperOptions = resolvePendingMessageReaperOptions;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const message_entity_1 = require("./entities/message.entity");
const hooks_1 = require("../../core/hooks");
const logger_service_1 = require("../../common/services/logger.service");
const configuration_1 = require("../../config/configuration");
function resolvePendingMessageReaperOptions(env = process.env) {
    const batch = Number(env.MESSAGE_REAPER_BATCH_SIZE);
    return {
        intervalMs: (0, configuration_1.resolveNonNegativeIntEnv)(env.MESSAGE_REAPER_INTERVAL_MS, 10 * 60_000),
        graceMs: (0, configuration_1.resolveNonNegativeIntEnv)(env.MESSAGE_REAPER_GRACE_MS, 60 * 60_000),
        batchSize: Number.isInteger(batch) && batch >= 1 ? batch : 50,
    };
}
let PendingMessageReaperService = class PendingMessageReaperService {
    messages;
    hookManager;
    logger = (0, logger_service_1.createLogger)('PendingMessageReaperService');
    timer;
    inFlight;
    stopping = false;
    constructor(messages, hookManager) {
        this.messages = messages;
        this.hookManager = hookManager;
    }
    onModuleInit() {
        const opts = resolvePendingMessageReaperOptions();
        if (opts.intervalMs <= 0) {
            this.logger.log('Pending message reaper disabled (MESSAGE_REAPER_INTERVAL_MS=0)');
            return;
        }
        this.timer = setInterval(() => {
            this.sweep(opts).catch(err => this.logger.error('Pending message reaper sweep failed', err instanceof Error ? err.stack : String(err)));
        }, opts.intervalMs);
        this.timer.unref?.();
    }
    async onModuleDestroy() {
        this.stopping = true;
        if (this.timer)
            clearInterval(this.timer);
        await this.inFlight;
    }
    async sweep(opts, now = new Date()) {
        const stats = { scanned: 0, reaped: 0, failed: 0 };
        if (this.inFlight || this.stopping)
            return stats;
        let settle;
        this.inFlight = new Promise(resolve => (settle = resolve));
        try {
            const cutoff = new Date(now.getTime() - opts.graceMs);
            const rows = await this.messages.find({
                where: {
                    direction: message_entity_1.MessageDirection.OUTGOING,
                    status: message_entity_1.MessageStatus.PENDING,
                    createdAt: (0, typeorm_2.LessThan)(cutoff),
                },
                order: { createdAt: 'ASC' },
                take: opts.batchSize,
            });
            for (const row of rows) {
                if (this.stopping)
                    break;
                stats.scanned++;
                try {
                    if (await this.reapRow(row, now)) {
                        stats.reaped++;
                    }
                }
                catch (err) {
                    this.logger.error('Reaping a stuck pending message failed', err instanceof Error ? err.message : String(err), { messageId: row.id, sessionId: row.sessionId, action: 'pending_message_reap_failed' });
                    stats.failed++;
                }
            }
            if (stats.reaped > 0) {
                this.logger.log(`Reaped ${stats.reaped} outbound message(s) stuck PENDING past the grace window`, {
                    action: 'pending_messages_reaped',
                });
            }
            return stats;
        }
        finally {
            this.inFlight = undefined;
            settle();
        }
    }
    async reapRow(row, now) {
        const media = row.metadata?.media;
        if (media) {
            delete media.data;
        }
        row.metadata = { ...(row.metadata ?? {}), reapedAt: now.toISOString() };
        row.status = message_entity_1.MessageStatus.FAILED;
        const reaped = await this.messages.update({ id: row.id, status: message_entity_1.MessageStatus.PENDING }, {
            status: row.status,
            metadata: row.metadata,
        });
        if (!reaped.affected) {
            return false;
        }
        void this.hookManager
            .execute('message:persisted', { sessionId: row.sessionId, message: { ...row } }, { sessionId: row.sessionId, source: 'PendingMessageReaperService' })
            .catch(() => undefined);
        return true;
    }
};
exports.PendingMessageReaperService = PendingMessageReaperService;
exports.PendingMessageReaperService = PendingMessageReaperService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(message_entity_1.Message, 'data')),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        hooks_1.HookManager])
], PendingMessageReaperService);
//# sourceMappingURL=pending-message-reaper.service.js.map