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
exports.WebhookReconcilerService = void 0;
exports.resolveWebhookReconcilerOptions = resolveWebhookReconcilerOptions;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const webhook_entity_1 = require("./entities/webhook.entity");
const webhook_outbox_service_1 = require("./webhook-outbox.service");
const webhook_delivery_service_1 = require("./webhook-delivery.service");
const deliver_once_1 = require("./utils/deliver-once");
const logger_service_1 = require("../../common/services/logger.service");
const configuration_1 = require("../../config/configuration");
function resolveWebhookReconcilerOptions(env = process.env) {
    const batch = Number(env.WEBHOOK_RECONCILE_BATCH_SIZE);
    const maxAttempts = Number(env.WEBHOOK_RECONCILE_MAX_ATTEMPTS);
    return {
        intervalMs: (0, configuration_1.resolveNonNegativeIntEnv)(env.WEBHOOK_RECONCILE_INTERVAL_MS, 60_000),
        graceMs: (0, configuration_1.resolveNonNegativeIntEnv)(env.WEBHOOK_RECONCILE_GRACE_MS, 60_000),
        batchSize: Number.isInteger(batch) && batch >= 1 ? batch : 50,
        maxAttempts: Number.isInteger(maxAttempts) && maxAttempts >= 1 ? maxAttempts : 5,
    };
}
let WebhookReconcilerService = class WebhookReconcilerService {
    webhooks;
    outbox;
    delivery;
    configService;
    logger = (0, logger_service_1.createLogger)('WebhookReconcilerService');
    timer;
    inFlight;
    stop = new AbortController();
    cursor;
    constructor(webhooks, outbox, delivery, configService) {
        this.webhooks = webhooks;
        this.outbox = outbox;
        this.delivery = delivery;
        this.configService = configService;
    }
    onModuleInit() {
        const opts = resolveWebhookReconcilerOptions();
        if (opts.intervalMs <= 0) {
            this.logger.log('Webhook delivery reconciler disabled (WEBHOOK_RECONCILE_INTERVAL_MS=0)');
            return;
        }
        this.timer = setInterval(() => {
            this.sweep(opts).catch(err => this.logger.error('Webhook reconcile sweep failed', err instanceof Error ? err.stack : String(err)));
        }, opts.intervalMs);
        this.timer.unref?.();
    }
    async onModuleDestroy() {
        this.stop.abort();
        if (this.timer)
            clearInterval(this.timer);
        if (!this.inFlight)
            return;
        const waitMs = Math.min(this.configService.get('webhook.shutdownDrainMs', webhook_delivery_service_1.DEFAULT_WEBHOOK_SHUTDOWN_DRAIN_MS), configuration_1.MAX_TIMER_MS);
        let timer;
        const settled = await Promise.race([
            this.inFlight.then(() => true),
            new Promise(resolve => (timer = setTimeout(resolve, waitMs, false))),
        ]);
        clearTimeout(timer);
        if (!settled) {
            this.logger.warn('Webhook reconcile pass still running at shutdown; continuing without it', {
                waitMs,
                action: 'webhook_reconcile_shutdown_timeout',
            });
        }
    }
    async sweep(opts, now = new Date()) {
        const stats = { scanned: 0, replayed: 0, failed: 0, skipped: 0 };
        if (this.inFlight || this.stop.signal.aborted)
            return stats;
        let settle;
        this.inFlight = new Promise(resolve => (settle = resolve));
        try {
            const cutoff = new Date(now.getTime() - opts.graceMs);
            let scannedThrough;
            const onScanned = (id) => {
                scannedThrough = id;
            };
            let rows = await this.outbox.findStale(cutoff, opts.batchSize, this.cursor, onScanned);
            if (rows.length === 0 && !scannedThrough && this.cursor) {
                this.cursor = undefined;
                rows = await this.outbox.findStale(cutoff, opts.batchSize, undefined, onScanned);
            }
            this.cursor = scannedThrough ?? rows.at(-1)?.id;
            stats.scanned = rows.length;
            const failedWebhooks = new Set();
            for (const row of rows) {
                if (this.stop.signal.aborted)
                    break;
                if (this.delivery.isLocallyPending(row.idempotencyKey)) {
                    stats.skipped++;
                    continue;
                }
                const webhook = await this.webhooks.findOne({ where: { id: row.webhookId } });
                if (!(0, deliver_once_1.isDeliverableWebhook)(webhook, row.event, row.sessionId)) {
                    await this.outbox.close(row.webhookId, row.idempotencyKey, 'failed');
                    stats.skipped++;
                    continue;
                }
                if (row.deliveryId && (await this.delivery.isQueueJobPending(row.deliveryId))) {
                    stats.skipped++;
                    continue;
                }
                if (row.deliveryId && (await this.delivery.hasQueueJobCompleted(row.deliveryId))) {
                    await this.outbox.close(row.webhookId, row.idempotencyKey, 'dispatched');
                    stats.skipped++;
                    continue;
                }
                if (row.attempts >= opts.maxAttempts) {
                    if (await this.delivery.recordReplayExhaustion(row, webhook.url)) {
                        await this.outbox.close(row.webhookId, row.idempotencyKey, 'failed');
                    }
                    stats.failed++;
                    continue;
                }
                if (this.stop.signal.aborted)
                    break;
                if (!(await this.outbox.countAttempt(row.id, row.attempts))) {
                    stats.skipped++;
                    continue;
                }
                try {
                    const outcome = await this.delivery.redeliver(webhook, row.sessionId, row.event, row.idempotencyKey, row.payload, { signal: this.stop.signal, oneDirectAttempt: failedWebhooks.has(row.webhookId) });
                    if (outcome === 'failed' || outcome === 'unrecorded') {
                        this.logger.warn(`Replay of ${row.event} to webhook ${row.webhookId} did not deliver`);
                        failedWebhooks.add(row.webhookId);
                        stats.failed++;
                        continue;
                    }
                    if (outcome === 'cancelled')
                        await this.outbox.close(row.webhookId, row.idempotencyKey, 'dispatched');
                    stats.replayed++;
                }
                catch (error) {
                    if ((0, webhook_delivery_service_1.isAbortedBackoff)(error, this.stop.signal)) {
                        this.logger.log(`Replay of ${row.event} to webhook ${row.webhookId} interrupted by shutdown`);
                        stats.skipped++;
                        continue;
                    }
                    this.logger.warn(`Replay of ${row.event} to webhook ${row.webhookId} failed: ${String(error)}`);
                    stats.failed++;
                }
            }
        }
        finally {
            this.inFlight = undefined;
            settle();
        }
        return stats;
    }
};
exports.WebhookReconcilerService = WebhookReconcilerService;
exports.WebhookReconcilerService = WebhookReconcilerService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(webhook_entity_1.Webhook, 'data')),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        webhook_outbox_service_1.WebhookOutboxService,
        webhook_delivery_service_1.WebhookDeliveryService,
        config_1.ConfigService])
], WebhookReconcilerService);
//# sourceMappingURL=webhook-reconciler.service.js.map