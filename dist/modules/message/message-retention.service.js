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
exports.MessageRetentionService = exports.MAX_MESSAGE_RETENTION_DAYS = void 0;
exports.resolveMessageRetentionDays = resolveMessageRetentionDays;
exports.resolveMessageRetentionCutoff = resolveMessageRetentionCutoff;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const message_entity_1 = require("./entities/message.entity");
const message_batch_entity_1 = require("./entities/message-batch.entity");
const logger_service_1 = require("../../common/services/logger.service");
const configuration_1 = require("../../config/configuration");
const DAY_MS = 24 * 60 * 60 * 1000;
const PRUNE_BATCH_SIZE = 500;
const MAX_BATCHES_PER_RUN = 200;
const CAPPED_RUN_FOLLOW_UP_MS = 60_000;
const TERMINAL_BATCH_STATUSES = [message_batch_entity_1.BatchStatus.COMPLETED, message_batch_entity_1.BatchStatus.CANCELLED, message_batch_entity_1.BatchStatus.FAILED];
exports.MAX_MESSAGE_RETENTION_DAYS = 36500;
function resolveMessageRetentionDays(env = process.env) {
    const days = (0, configuration_1.resolveNonNegativeIntEnv)(env.MESSAGE_RETENTION_DAYS, 0);
    return days > exports.MAX_MESSAGE_RETENTION_DAYS ? 0 : days;
}
function resolveMessageRetentionCutoff(now = new Date(), env = process.env) {
    const days = resolveMessageRetentionDays(env);
    return days > 0 ? new Date(now.getTime() - days * DAY_MS) : undefined;
}
let MessageRetentionService = class MessageRetentionService {
    messages;
    batches;
    logger = (0, logger_service_1.createLogger)('MessageRetentionService');
    timer;
    followUp;
    stopped = false;
    running = false;
    constructor(messages, batches) {
        this.messages = messages;
        this.batches = batches;
    }
    onModuleInit() {
        const days = resolveMessageRetentionDays();
        if (days <= 0) {
            this.logger.log('Message retention disabled (MESSAGE_RETENTION_DAYS unset or <= 0)');
            return;
        }
        const run = () => {
            this.prune()
                .then(({ messages, batches }) => {
                if (messages > 0 || batches > 0) {
                    this.logger.log(`Pruned ${messages} message(s) and ${batches} finished batch(es) older than ${days} day(s)`, { action: 'messages_pruned', messages, batches });
                }
                if (messages >= MAX_BATCHES_PER_RUN * PRUNE_BATCH_SIZE && !this.stopped) {
                    this.logger.warn('Message retention hit its per-run cap; expired rows remain, running again shortly', {
                        action: 'messages_prune_capped',
                    });
                    clearTimeout(this.followUp);
                    this.followUp = setTimeout(run, CAPPED_RUN_FOLLOW_UP_MS);
                    this.followUp.unref?.();
                }
            })
                .catch(err => this.logger.error('Message retention prune failed', err instanceof Error ? err.stack : String(err)));
        };
        run();
        this.timer = setInterval(run, DAY_MS);
        this.timer.unref?.();
    }
    onModuleDestroy() {
        this.stopped = true;
        if (this.timer)
            clearInterval(this.timer);
        clearTimeout(this.followUp);
    }
    async prune(now = new Date()) {
        const cutoff = resolveMessageRetentionCutoff(now);
        if (!cutoff || this.running)
            return { messages: 0, batches: 0 };
        this.running = true;
        try {
            let messages = 0;
            for (let i = 0; i < MAX_BATCHES_PER_RUN; i++) {
                const rows = await this.messages.find({
                    select: { id: true },
                    where: { createdAt: (0, typeorm_2.LessThan)(cutoff) },
                    order: { createdAt: 'ASC' },
                    take: PRUNE_BATCH_SIZE,
                });
                if (rows.length === 0)
                    break;
                await this.messages.delete({ id: (0, typeorm_2.In)(rows.map(row => row.id)) });
                messages += rows.length;
                if (rows.length < PRUNE_BATCH_SIZE)
                    break;
            }
            const { affected } = await this.batches.delete({
                status: (0, typeorm_2.In)(TERMINAL_BATCH_STATUSES),
                createdAt: (0, typeorm_2.LessThan)(cutoff),
            });
            return { messages, batches: affected ?? 0 };
        }
        finally {
            this.running = false;
        }
    }
};
exports.MessageRetentionService = MessageRetentionService;
exports.MessageRetentionService = MessageRetentionService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(message_entity_1.Message, 'data')),
    __param(1, (0, typeorm_1.InjectRepository)(message_batch_entity_1.MessageBatch, 'data')),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], MessageRetentionService);
//# sourceMappingURL=message-retention.service.js.map