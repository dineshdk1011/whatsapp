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
exports.WebhookProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const typeorm_2 = require("typeorm");
const logger_service_1 = require("../../../common/services/logger.service");
const queue_names_1 = require("../queue-names");
const redis_connection_1 = require("../redis-connection");
const close_worker_1 = require("./close-worker");
const webhook_entity_1 = require("../../webhook/entities/webhook.entity");
const webhook_outbox_service_1 = require("../../webhook/webhook-outbox.service");
const webhook_delivery_failure_entity_1 = require("../../webhook/entities/webhook-delivery-failure.entity");
const record_delivery_failure_1 = require("../../webhook/utils/record-delivery-failure");
const deliver_once_1 = require("../../webhook/utils/deliver-once");
const hooks_1 = require("../../../core/hooks");
const ssrf_guard_1 = require("../../../common/security/ssrf-guard");
const webhook_delivery_metrics_1 = require("../../../common/metrics/webhook-delivery-metrics");
const STALL_EXHAUSTION_MESSAGE = 'job stalled more than allowable limit';
let WebhookProcessor = class WebhookProcessor extends bullmq_1.WorkerHost {
    webhookRepository;
    failureRepository;
    hookManager;
    configService;
    outbox;
    logger = (0, logger_service_1.createLogger)('WebhookProcessor');
    failingWebhooks = new Set();
    degradedInFlight = new Map();
    degradedSessionConcurrency;
    constructor(webhookRepository, failureRepository, hookManager, configService, outbox) {
        super();
        this.webhookRepository = webhookRepository;
        this.failureRepository = failureRepository;
        this.hookManager = hookManager;
        this.configService = configService;
        this.outbox = outbox;
        this.degradedSessionConcurrency =
            this.configService.get('webhook.degradedSessionConcurrency') ??
                Math.max(1, Math.floor((0, redis_connection_1.webhookWorkerConcurrency)() / 4));
    }
    async onModuleDestroy() {
        await (0, close_worker_1.closeWorkerIfStarted)(this, this.configService.get('webhook.timeout', 10000) + 5000);
    }
    async process(job, token) {
        const { webhookId, payload } = job.data;
        const sessionId = payload.sessionId;
        const gated = this.failingWebhooks.has(webhookId);
        if (gated) {
            const inFlight = this.degradedInFlight.get(sessionId) ?? 0;
            if (inFlight >= this.degradedSessionConcurrency) {
                const base = Math.max(1000, this.configService.get('webhook.retryDelay', 5000));
                const bounces = Math.max(0, job.attemptsStarted - job.attemptsMade - 1);
                const delay = base * 2 ** Math.min(bounces, 6);
                await job.moveToDelayed(Date.now() + delay + Math.floor(Math.random() * delay), token);
                throw new bullmq_2.DelayedError();
            }
            this.degradedInFlight.set(sessionId, inFlight + 1);
        }
        try {
            return await this.deliver(job);
        }
        finally {
            if (gated) {
                const left = (this.degradedInFlight.get(sessionId) ?? 1) - 1;
                if (left > 0)
                    this.degradedInFlight.set(sessionId, left);
                else
                    this.degradedInFlight.delete(sessionId);
            }
        }
    }
    async deliver(job) {
        const { webhookId, event, payload, maxRetries } = job.data;
        const startTime = Date.now();
        const sessionId = payload.sessionId;
        this.logger.log(`Processing webhook job ${job.id}`, {
            webhookId,
            event,
            deliveryId: payload.deliveryId,
            idempotencyKey: payload.idempotencyKey,
            attempt: job.attemptsMade + 1,
            action: 'webhook_process_start',
        });
        const ctx = {
            job,
            webhookId,
            url: job.data.url,
            event,
            payload,
            maxRetries,
            sessionId,
            startTime,
        };
        try {
            const current = await this.loadDeliverableWebhook(webhookId, event, sessionId);
            if (!current) {
                this.logger.warn('Skipping queued webhook delivery: webhook removed, disabled or unsubscribed', {
                    webhookId,
                    event,
                    deliveryId: payload.deliveryId,
                    idempotencyKey: payload.idempotencyKey,
                    action: 'webhook_skipped_stale',
                });
                this.failingWebhooks.delete(webhookId);
                await this.outbox.close(webhookId, payload.idempotencyKey, 'dispatched');
                return { statusCode: 0, success: false, error: 'webhook removed, disabled or unsubscribed', responseTime: 0 };
            }
            ctx.url = current.url;
            const body = JSON.stringify(payload);
            const requestHeaders = (0, deliver_once_1.buildDeliveryHeaders)(current, event, payload.idempotencyKey, payload.deliveryId, body, job.attemptsMade);
            const { status, responseTime } = await this.postToReceiver(ctx, body, requestHeaders);
            this.failingWebhooks.delete(webhookId);
            await this.outbox.close(webhookId, payload.idempotencyKey, 'dispatched');
            await this.recordSuccessfulDelivery(ctx, status, responseTime);
            return {
                statusCode: status,
                success: true,
                responseTime,
            };
        }
        catch (error) {
            this.failingWebhooks.add(webhookId);
            await this.recordDeliveryFailure(ctx, error);
            throw error;
        }
    }
    async loadDeliverableWebhook(webhookId, event, sessionId) {
        const row = await this.webhookRepository.findOne({ where: { id: webhookId } });
        return (0, deliver_once_1.isDeliverableWebhook)(row, event, sessionId) ? row : null;
    }
    async postToReceiver(ctx, body, requestHeaders) {
        const { url, startTime } = ctx;
        const { status } = await (0, deliver_once_1.postWebhookPayload)(url, body, requestHeaders, this.configService.get('webhook.timeout', 10000));
        const responseTime = Date.now() - startTime;
        return { status, responseTime };
    }
    async recordSuccessfulDelivery(ctx, status, responseTime) {
        const { job, webhookId, event, payload, sessionId } = ctx;
        try {
            await this.webhookRepository.update(webhookId, {
                lastTriggeredAt: new Date(),
            });
        }
        catch (bookkeepingError) {
            this.logger.error('Webhook delivered but lastTriggeredAt update failed', bookkeepingError instanceof Error ? bookkeepingError.message : String(bookkeepingError), { webhookId, deliveryId: payload.deliveryId, action: 'webhook_bookkeeping_failed' });
        }
        await (0, record_delivery_failure_1.clearDeliveryFailureRows)(this.failureRepository, this.logger, webhookId, payload.idempotencyKey);
        await this.hookManager.execute('webhook:delivered', {
            sessionId,
            event,
            webhookId,
            deliveryId: payload.deliveryId,
            statusCode: status,
            responseTime,
            attempt: job.attemptsMade + 1,
        }, { sessionId, source: 'WebhookProcessor' });
        this.logger.log(`Webhook delivered successfully`, {
            webhookId,
            event,
            deliveryId: payload.deliveryId,
            idempotencyKey: payload.idempotencyKey,
            statusCode: status,
            responseTime,
            attempt: job.attemptsMade + 1,
            action: 'webhook_delivered',
        });
    }
    async recordDeliveryFailure(ctx, error) {
        const { job, webhookId, url, event, payload, maxRetries, sessionId, startTime } = ctx;
        const responseTime = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);
        const isFinalAttempt = job.attemptsMade + 1 >= maxRetries;
        this.logger.error(`Webhook delivery failed`, errorMessage, {
            webhookId,
            event,
            deliveryId: payload.deliveryId,
            idempotencyKey: payload.idempotencyKey,
            responseTime,
            attempt: job.attemptsMade + 1,
            maxRetries,
            isFinalAttempt,
            action: 'webhook_failed',
        });
        if (isFinalAttempt) {
            const clientError = (0, ssrf_guard_1.redactSsrfError)(error);
            await this.hookManager.execute('webhook:error', {
                sessionId,
                event,
                webhookId,
                deliveryId: payload.deliveryId,
                error: clientError,
                attempt: job.attemptsMade + 1,
            }, { sessionId, source: 'WebhookProcessor' });
            const recorded = await (0, record_delivery_failure_1.recordWebhookDeliveryFailure)(this.failureRepository, this.logger, {
                webhookId,
                sessionId,
                event,
                url,
                idempotencyKey: payload.idempotencyKey,
                deliveryId: payload.deliveryId,
                attempts: job.attemptsMade + 1,
                lastStatusCode: (0, record_delivery_failure_1.statusCodeFromError)(errorMessage),
                lastError: clientError,
                ...(this.configService.get('webhook.failurePayloadRetentionHours', 0) > 0 && job.data.replayData
                    ? { payload: job.data.replayData }
                    : {}),
            });
            if (recorded !== false)
                (0, webhook_delivery_metrics_1.incrementWebhookDeliveryFailures)();
            if (recorded !== null)
                await this.outbox.close(webhookId, payload.idempotencyKey, 'dispatched');
        }
    }
    async onWorkerFailed(job, error) {
        if (!job || job.deferredFailure !== STALL_EXHAUSTION_MESSAGE || error.message !== STALL_EXHAUSTION_MESSAGE) {
            return;
        }
        const { webhookId, event, payload } = job.data;
        const sessionId = payload.sessionId;
        let url = job.data.url;
        try {
            const current = await this.loadDeliverableWebhook(webhookId, event, sessionId);
            if (!current) {
                return;
            }
            url = current.url;
        }
        catch (readError) {
            this.logger.warn('Could not re-read webhook for a stalled job; recording the enqueue-time URL', {
                webhookId,
                error: readError instanceof Error ? readError.message : String(readError),
            });
        }
        this.logger.error('Webhook job failed after stalling beyond the recovery limit', error.message, {
            webhookId,
            event,
            deliveryId: payload.deliveryId,
            idempotencyKey: payload.idempotencyKey,
            attemptsMade: job.attemptsMade,
            action: 'webhook_stall_exhausted',
        });
        await this.hookManager.execute('webhook:error', {
            sessionId,
            event,
            webhookId,
            deliveryId: payload.deliveryId,
            error: error.message,
            attempt: job.attemptsMade,
        }, { sessionId, source: 'WebhookProcessor' });
        const recorded = await (0, record_delivery_failure_1.recordWebhookDeliveryFailure)(this.failureRepository, this.logger, {
            webhookId,
            sessionId,
            event,
            url,
            idempotencyKey: payload.idempotencyKey,
            deliveryId: payload.deliveryId,
            attempts: Math.max(1, job.attemptsMade),
            lastStatusCode: null,
            lastError: error.message,
            ...(this.configService.get('webhook.failurePayloadRetentionHours', 0) > 0 && job.data.replayData
                ? { payload: job.data.replayData }
                : {}),
        });
        if (recorded !== false)
            (0, webhook_delivery_metrics_1.incrementWebhookDeliveryFailures)();
        if (recorded !== null)
            await this.outbox.close(webhookId, payload.idempotencyKey, 'dispatched');
    }
};
exports.WebhookProcessor = WebhookProcessor;
__decorate([
    (0, bullmq_1.OnWorkerEvent)('failed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Error]),
    __metadata("design:returntype", Promise)
], WebhookProcessor.prototype, "onWorkerFailed", null);
exports.WebhookProcessor = WebhookProcessor = __decorate([
    (0, bullmq_1.Processor)(queue_names_1.QUEUE_NAMES.WEBHOOK, { connection: (0, redis_connection_1.workerConnectionOptions)(), concurrency: (0, redis_connection_1.webhookWorkerConcurrency)() }),
    __param(0, (0, typeorm_1.InjectRepository)(webhook_entity_1.Webhook, 'data')),
    __param(1, (0, typeorm_1.InjectRepository)(webhook_delivery_failure_entity_1.WebhookDeliveryFailure, 'data')),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        hooks_1.HookManager,
        config_1.ConfigService,
        webhook_outbox_service_1.WebhookOutboxService])
], WebhookProcessor);
//# sourceMappingURL=webhook.processor.js.map