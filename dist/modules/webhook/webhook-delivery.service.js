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
exports.WebhookDeliveryService = exports.isAbortedBackoff = exports.DEFAULT_WEBHOOK_SHUTDOWN_DRAIN_MS = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const config_1 = require("@nestjs/config");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const promises_1 = require("node:timers/promises");
const node_crypto_1 = require("node:crypto");
const webhook_entity_1 = require("./entities/webhook.entity");
const webhook_outbox_service_1 = require("./webhook-outbox.service");
const webhook_delivery_failure_entity_1 = require("./entities/webhook-delivery-failure.entity");
const record_delivery_failure_1 = require("./utils/record-delivery-failure");
const deliver_once_1 = require("./utils/deliver-once");
const logger_service_1 = require("../../common/services/logger.service");
const shutdown_budget_1 = require("../../common/services/shutdown-budget");
Object.defineProperty(exports, "DEFAULT_WEBHOOK_SHUTDOWN_DRAIN_MS", { enumerable: true, get: function () { return shutdown_budget_1.DEFAULT_WEBHOOK_SHUTDOWN_DRAIN_MS; } });
const inline_media_1 = require("../../common/utils/inline-media");
const webhook_delivery_metrics_1 = require("../../common/metrics/webhook-delivery-metrics");
const queue_names_1 = require("../queue/queue-names");
const redis_connection_1 = require("../queue/redis-connection");
const idempotency_util_1 = require("./utils/idempotency.util");
const filter_evaluator_1 = require("./filters/filter-evaluator");
const lid_mapping_store_service_1 = require("../../engine/identity/lid-mapping-store.service");
const ssrf_guard_1 = require("../../common/security/ssrf-guard");
const hooks_1 = require("../../core/hooks");
const concurrency_limiter_1 = require("../../common/utils/concurrency-limiter");
const hook_results_1 = require("../../core/hooks/hook-results");
const wildcard_events_1 = require("../../common/utils/wildcard-events");
const DEFAULT_WEBHOOK_MAX_PAYLOAD_BYTES = 1024 * 1024;
const OPT_IN_SUBSCRIPTIONS_TTL_MS = 5000;
class UnrecordedWebhookFailure extends Error {
}
const isLimiterClosed = (error) => error instanceof Error && error.message === 'ConcurrencyLimiter closed';
const isLimiterFull = (error) => error instanceof Error && error.message === 'ConcurrencyLimiter queue full';
const describeOptInStage = ({ sessionId, webhookId }) => webhookId === null ? `session ${sessionId}` : `webhook ${webhookId} of session ${sessionId}`;
const isAbortedBackoff = (error, signal) => signal?.aborted === true && error?.name === 'AbortError';
exports.isAbortedBackoff = isAbortedBackoff;
const isPlainObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
let WebhookDeliveryService = class WebhookDeliveryService {
    webhookRepository;
    failureRepository;
    configService;
    hookManager;
    outbox;
    lidMappingStore;
    webhookQueue;
    logger = (0, logger_service_1.createLogger)('WebhookDelivery');
    queueEnabled;
    dispatchLimiter;
    dispatchMaxQueued;
    failingWebhooks = new Set();
    degradedSessionGates = new Map();
    degradedSessionConcurrency;
    inFlightDeliveries = new Map();
    pendingBookkeeping = new Set();
    locallyPending = new Map();
    optInSubscriptions = new Map();
    optInStages = new Map();
    optInSessionStages = new Map();
    constructor(webhookRepository, failureRepository, configService, hookManager, outbox, lidMappingStore, webhookQueue) {
        this.webhookRepository = webhookRepository;
        this.failureRepository = failureRepository;
        this.configService = configService;
        this.hookManager = hookManager;
        this.outbox = outbox;
        this.lidMappingStore = lidMappingStore;
        this.webhookQueue = webhookQueue;
        this.queueEnabled = configService.get('queue.enabled', false);
        const dispatchConcurrency = this.configService.get('webhook.dispatchConcurrency', 16);
        this.dispatchMaxQueued = this.configService.get('webhook.dispatchMaxQueued', 1000);
        this.dispatchLimiter = new concurrency_limiter_1.ConcurrencyLimiter(dispatchConcurrency, this.dispatchMaxQueued);
        this.degradedSessionConcurrency =
            this.configService.get('webhook.degradedSessionConcurrency') ??
                Math.max(1, Math.floor(dispatchConcurrency / 4));
    }
    onModuleInit() {
        const drainMs = this.configService.get('webhook.shutdownDrainMs', shutdown_budget_1.DEFAULT_WEBHOOK_SHUTDOWN_DRAIN_MS);
        const deliveryTimeoutMs = this.configService.get('webhook.timeout', 10_000);
        if (Number.isFinite(drainMs) && Number.isFinite(deliveryTimeoutMs) && drainMs < deliveryTimeoutMs) {
            this.logger.warn(`WEBHOOK_SHUTDOWN_DRAIN_MS (${drainMs}ms) is shorter than WEBHOOK_TIMEOUT (${deliveryTimeoutMs}ms) — ` +
                `an in-flight delivery that takes nearly the full timeout will be abandoned at shutdown. ` +
                `Raise WEBHOOK_SHUTDOWN_DRAIN_MS to at least WEBHOOK_TIMEOUT if you want shutdown to wait for deliveries to complete.`);
        }
    }
    async onModuleDestroy() {
        for (const { stage } of this.optInStages.values())
            stage.close();
        for (const { gate } of this.optInSessionStages.values())
            gate.close();
        if (!this.queueEnabled) {
            this.dispatchLimiter.close();
            for (const gate of this.degradedSessionGates.values())
                gate.close();
        }
        const drainMs = Math.max(0, this.configService.get('webhook.shutdownDrainMs', shutdown_budget_1.DEFAULT_WEBHOOK_SHUTDOWN_DRAIN_MS));
        const deadline = Date.now() + drainMs;
        while (this.dispatchLimiter.activeCount > 0 ||
            this.inFlightDeliveries.size > 0 ||
            this.pendingBookkeeping.size > 0) {
            const remaining = deadline - Date.now();
            if (remaining <= 0)
                break;
            await (0, promises_1.setTimeout)(Math.min(50, remaining));
        }
        for (const lost of this.inFlightDeliveries.values()) {
            this.logger.error('Webhook delivery abandoned during shutdown', undefined, {
                ...lost,
                action: 'webhook_delivery_abandoned_shutdown',
            });
        }
        this.inFlightDeliveries.clear();
    }
    async dispatch(sessionId, event, data) {
        if (!wildcard_events_1.WILDCARD_EXCLUDED_EVENTS.includes(event))
            return this.fanOut(sessionId, event, data, null);
        const webhookIds = await this.webhooksNamingOptInEvent(sessionId, event);
        if (webhookIds.length === 1)
            return this.dispatchThroughOptInStage(sessionId, event, data, webhookIds[0], 1);
        const settled = await Promise.allSettled(webhookIds.map(webhookId => this.dispatchThroughOptInStage(sessionId, event, data, webhookId, webhookIds.length)));
        const failed = settled.find((result) => result.status === 'rejected');
        if (failed)
            throw failed.reason;
    }
    async dispatchThroughOptInStage(sessionId, event, data, webhookId, named) {
        const key = JSON.stringify([sessionId, webhookId]);
        let sessionStage = this.optInSessionStages.get(sessionId);
        if (!sessionStage) {
            sessionStage = { gate: new concurrency_limiter_1.ConcurrencyLimiter(Math.floor(this.dispatchLimiter.maxCount / 4)), stages: 0 };
            this.optInSessionStages.set(sessionId, sessionStage);
        }
        let entry = this.optInStages.get(key);
        if (!entry) {
            entry = {
                stage: new concurrency_limiter_1.ConcurrencyLimiter(Math.floor(this.dispatchLimiter.maxCount / 4 / named), Math.max(1, Math.floor((this.dispatchMaxQueued * 3) / 4))),
                dropped: 0,
                sessionId,
                webhookId,
            };
            this.optInStages.set(key, entry);
            sessionStage.stages++;
        }
        const sessionGate = sessionStage.gate;
        try {
            await entry.stage.run(() => sessionGate.run(() => this.fanOut(sessionId, event, data, webhookId)));
        }
        catch (error) {
            if (isLimiterFull(error))
                this.noteOptInDrop(event, entry);
            else if (!isLimiterClosed(error))
                throw error;
        }
        finally {
            this.releaseOptInStage(key, entry);
        }
    }
    noteOptInDrop(event, entry) {
        (0, webhook_delivery_metrics_1.incrementWebhookDeliveryFailures)();
        if (entry.dropped++ > 0)
            return;
        const { sessionId, webhookId } = entry;
        this.logger.warn(`Dropping ${event} events of ${describeOptInStage(entry)}: its queue of opt-in events is full`, {
            sessionId,
            webhookId: webhookId ?? undefined,
            event,
            action: 'webhook_opt_in_dropping',
        });
    }
    releaseOptInStage(key, entry) {
        if (entry.stage.activeCount > 0 || entry.stage.queuedCount > 0 || this.optInStages.get(key) !== entry)
            return;
        this.optInStages.delete(key);
        const sessionStage = this.optInSessionStages.get(entry.sessionId);
        if (sessionStage && --sessionStage.stages === 0)
            this.optInSessionStages.delete(entry.sessionId);
        if (entry.dropped === 0)
            return;
        const { sessionId, webhookId } = entry;
        this.logger.warn(`Dropped ${entry.dropped} opt-in events of ${describeOptInStage(entry)} while its queue was full`, {
            sessionId,
            webhookId: webhookId ?? undefined,
            dropped: entry.dropped,
            action: 'webhook_opt_in_dropped',
        });
    }
    async fanOut(sessionId, event, data, only) {
        const webhooks = await this.loadActiveWebhooks(sessionId, event);
        const matchingWebhooks = await this.filterMatchingWebhooks(only === null ? webhooks : webhooks.filter(webhook => webhook.id === only), event, data);
        const baseIdempotencyKey = (0, idempotency_util_1.generateIdempotencyKey)(event, { ...data, sessionId }, (0, node_crypto_1.randomUUID)());
        const baseData = matchingWebhooks.length > 0
            ? (0, inline_media_1.shedInlineMedia)(data, this.configService.get('webhook.mediaInlineMaxBytes', inline_media_1.DEFAULT_WEBHOOK_MEDIA_INLINE_MAX_BYTES))
            : data;
        data = baseData;
        const ctx = { sessionId, event, baseData };
        await Promise.allSettled(matchingWebhooks.map(webhook => this.dispatchWithLimit(webhook, baseIdempotencyKey, ctx)));
    }
    invalidateOptInSubscriptions(sessionId) {
        this.optInSubscriptions.delete(sessionId);
    }
    async webhooksNamingOptInEvent(sessionId, event) {
        const now = Date.now();
        let entry = this.optInSubscriptions.get(sessionId);
        if (!entry || entry.expiresAt <= now) {
            const created = {
                named: this.webhookRepository
                    .find({ select: { id: true, events: true }, where: { sessionId, active: true } })
                    .then(rows => {
                    const named = new Map();
                    for (const row of rows) {
                        if (!Array.isArray(row.events))
                            continue;
                        for (const e of new Set(row.events)) {
                            if (!wildcard_events_1.WILDCARD_EXCLUDED_EVENTS.includes(e))
                                continue;
                            const ids = named.get(e);
                            if (ids)
                                ids.push(row.id);
                            else
                                named.set(e, [row.id]);
                        }
                    }
                    return named;
                }),
                expiresAt: now + OPT_IN_SUBSCRIPTIONS_TTL_MS,
            };
            created.named.catch(() => {
                if (this.optInSubscriptions.get(sessionId) === created)
                    this.optInSubscriptions.delete(sessionId);
            });
            this.optInSubscriptions.set(sessionId, created);
            entry = created;
        }
        try {
            return [...((await entry.named).get(event) ?? [])];
        }
        catch {
            return [null];
        }
    }
    async loadActiveWebhooks(sessionId, event) {
        try {
            return await this.webhookRepository.find({
                where: { sessionId, active: true },
            });
        }
        catch (error) {
            this.logger.error(`Webhook dispatch lookup failed for ${event}`, String(error), {
                sessionId,
                action: 'webhook_dispatch_lookup_failed',
            });
            return [];
        }
    }
    async filterMatchingWebhooks(webhooks, event, data) {
        const subscribed = webhooks.filter(w => Array.isArray(w.events) && (0, wildcard_events_1.subscriptionCoversEvent)(w.events, event));
        const resolveLid = await (0, filter_evaluator_1.prepareFilterLidResolver)(subscribed.map(w => w.filters), event, data, this.lidMappingStore ? lids => this.lidMappingStore.phonesForLidsPersisted(lids) : undefined);
        const matching = subscribed.filter(w => {
            try {
                const filters = w.filters;
                if (filters != null &&
                    (typeof filters !== 'object' ||
                        Array.isArray(filters) ||
                        (w.filters?.conditions != null && !Array.isArray(w.filters.conditions)))) {
                    throw new TypeError('filters must be an object with a conditions array');
                }
                return (0, filter_evaluator_1.evaluateFilters)(w.filters, event, data, resolveLid);
            }
            catch (error) {
                this.logger.warn('Skipping webhook with malformed filters', {
                    webhookId: w.id,
                    event,
                    error: String(error),
                    action: 'webhook_filters_invalid',
                });
                return false;
            }
        });
        if (matching.length < subscribed.length) {
            this.logger.debug('Webhook filters suppressed a delivery', {
                action: 'webhook_filter_suppressed',
                event,
                subscribed: subscribed.length,
                suppressed: subscribed.length - matching.length,
                payloadFields: Object.keys(data).sort().join(','),
            });
        }
        return matching;
    }
    async recordUndelivered(webhook, deliveryId, idempotencyKey, error, action, ctx) {
        const { sessionId, event } = ctx;
        const lastError = (0, ssrf_guard_1.redactSsrfError)(error, this.logger, 'webhook dispatch');
        const recorded = await (0, record_delivery_failure_1.recordWebhookDeliveryFailure)(this.failureRepository, this.logger, {
            webhookId: webhook.id,
            sessionId,
            event,
            url: webhook.url,
            idempotencyKey,
            deliveryId,
            attempts: 0,
            lastStatusCode: null,
            lastError,
        });
        if (recorded !== false)
            (0, webhook_delivery_metrics_1.incrementWebhookDeliveryFailures)();
        try {
            await this.hookManager.execute('webhook:error', { sessionId, event, webhookId: webhook.id, deliveryId, error: lastError }, { sessionId, source: 'WebhookService' });
        }
        catch (hookError) {
            this.logger.error('webhook:error hook failed while reporting an undelivered webhook', String(hookError), {
                webhookId: webhook.id,
                deliveryId,
                action: 'webhook_error_hook_failed',
            });
        }
        this.logger.error(`Webhook ${webhook.id} was not dispatched`, lastError, {
            webhookId: webhook.id,
            deliveryId,
            action,
        });
        return recorded !== null;
    }
    async preflightDelivery(webhook, deliveryId, idempotencyKey, ctx) {
        const { sessionId, event, baseData } = ctx;
        try {
            const payload = {
                event,
                timestamp: new Date().toISOString(),
                sessionId,
                idempotencyKey,
                deliveryId,
                data: structuredClone(baseData),
            };
            const payloadTimestamp = payload.timestamp;
            const { continue: shouldContinue, data: hookResult } = await this.hookManager.execute('webhook:before', { sessionId, event, payload }, {
                sessionId,
                source: 'WebhookService',
                accept: hook_results_1.isWebhookBeforeResult,
            });
            if (!shouldContinue) {
                this.logger.debug(`Webhook dispatch cancelled by plugin for ${event}`, {
                    webhookId: webhook.id,
                    action: 'webhook_cancelled_by_plugin',
                });
                return 'cancelled';
            }
            const hookPayload = hookResult?.payload ?? payload;
            const usable = isPlainObject(hookPayload);
            if (!usable) {
                this.logger.warn('A webhook:before hook returned a payload that is not an object; sending the original', {
                    webhookId: webhook.id,
                    event,
                    received: Array.isArray(hookPayload) ? 'array' : typeof hookPayload,
                    action: 'hook_payload_discarded',
                });
            }
            const finalPayload = usable ? hookPayload : payload;
            finalPayload.event = event;
            finalPayload.sessionId = sessionId;
            finalPayload.timestamp = payloadTimestamp;
            finalPayload.idempotencyKey = idempotencyKey;
            finalPayload.deliveryId = deliveryId;
            const maxPayloadBytes = this.configService.get('webhook.maxPayloadBytes', DEFAULT_WEBHOOK_MAX_PAYLOAD_BYTES);
            let body = JSON.stringify(finalPayload);
            let payloadBytes = Buffer.byteLength(body, 'utf8');
            if (payloadBytes > maxPayloadBytes) {
                const shedData = (0, inline_media_1.shedInlineMedia)(finalPayload.data, 0);
                if (shedData !== finalPayload.data) {
                    finalPayload.data = shedData;
                    body = JSON.stringify(finalPayload);
                    payloadBytes = Buffer.byteLength(body, 'utf8');
                }
            }
            if (payloadBytes > maxPayloadBytes) {
                const recorded = await this.recordUndelivered(webhook, deliveryId, idempotencyKey, new Error(`Webhook payload is ${payloadBytes} bytes after webhook:before hooks, exceeding the ${maxPayloadBytes}-byte cap`), 'webhook_payload_oversize', ctx);
                return recorded ? null : 'unrecorded';
            }
            return { finalPayload, body };
        }
        catch (error) {
            const recorded = await this.recordUndelivered(webhook, deliveryId, idempotencyKey, error, 'webhook_dispatch_preflight_failed', ctx);
            return recorded ? null : 'unrecorded';
        }
    }
    async deliverOne(webhook, deliveryId, idempotencyKey, ctx) {
        const preflight = await this.preflightDelivery(webhook, deliveryId, idempotencyKey, ctx);
        if (preflight === 'unrecorded')
            return 'unrecorded';
        if (preflight === 'cancelled') {
            return 'cancelled';
        }
        if (!preflight) {
            return 'failed';
        }
        const { finalPayload, body } = preflight;
        if (!ctx.singleAttempt && this.queueEnabled && this.webhookQueue) {
            return this.enqueueWithFallback(webhook, finalPayload, body, deliveryId, idempotencyKey, ctx);
        }
        return this.deliverDirect(webhook, finalPayload, body, deliveryId, ctx);
    }
    async enqueueWithFallback(webhook, finalPayload, body, deliveryId, idempotencyKey, ctx) {
        const { sessionId, event } = ctx;
        try {
            const jobData = {
                webhookId: webhook.id,
                url: webhook.url,
                event,
                payload: finalPayload,
                attempt: 1,
                maxRetries: webhook.retryCount,
                ...(this.keepsFailurePayload() ? { replayData: ctx.baseData } : {}),
            };
            await (0, redis_connection_1.producerReady)(this.webhookQueue);
            await this.webhookQueue.add(`webhook-${webhook.id}`, jobData, {
                jobId: deliveryId,
                attempts: webhook.retryCount,
                backoff: {
                    type: 'exponential',
                    delay: this.configService.get('webhook.retryDelay', 5000),
                },
            });
            await this.outbox.markQueued(webhook.id, idempotencyKey, deliveryId);
            await this.hookManager.execute('webhook:queued', { sessionId, event, webhookId: webhook.id, deliveryId }, { sessionId, source: 'WebhookService' });
            this.logger.debug(`Webhook job queued for ${webhook.id}`, {
                webhookId: webhook.id,
                event,
                idempotencyKey,
                deliveryId,
                action: 'webhook_queued',
            });
        }
        catch (error) {
            ctx.signal?.throwIfAborted();
            await this.hookManager.execute('webhook:error', { sessionId, event, webhookId: webhook.id, error: `Queue failed: ${String(error)}` }, { sessionId, source: 'WebhookService' });
            this.logger.error(`Failed to queue webhook ${webhook.id}`, String(error), {
                webhookId: webhook.id,
                action: 'webhook_queue_failed',
            });
            try {
                if (!(await this.deliverWebhook(webhook, finalPayload, body, this.directOptions(ctx))))
                    return 'cancelled';
                await this.hookManager.execute('webhook:delivered', { sessionId, event, webhookId: webhook.id, deliveryId, fallback: 'queue_failed' }, { sessionId, source: 'WebhookService' });
                await this.hookManager.execute('webhook:after', { sessionId, event, webhookId: webhook.id, success: true, fallback: 'queue_failed' }, { sessionId, source: 'WebhookService' });
            }
            catch (fallbackError) {
                if (isLimiterClosed(fallbackError) || (0, exports.isAbortedBackoff)(fallbackError, ctx.signal))
                    throw fallbackError;
                await this.hookManager.execute('webhook:error', {
                    sessionId,
                    event,
                    webhookId: webhook.id,
                    error: `Queue fallback delivery failed: ${(0, ssrf_guard_1.redactSsrfError)(fallbackError, this.logger, 'webhook fallback delivery')}`,
                }, { sessionId, source: 'WebhookService' });
                this.logger.error(`Queue fallback delivery failed for webhook ${webhook.id}`, String(fallbackError), {
                    webhookId: webhook.id,
                    action: 'webhook_queue_fallback_failed',
                });
                return fallbackError instanceof UnrecordedWebhookFailure ? 'unrecorded' : 'failed';
            }
            return 'delivered';
        }
        return 'enqueued';
    }
    async deliverDirect(webhook, finalPayload, body, deliveryId, ctx) {
        const { sessionId, event } = ctx;
        try {
            if (!(await this.deliverWebhook(webhook, finalPayload, body, this.directOptions(ctx))))
                return 'cancelled';
            await this.hookManager.execute('webhook:delivered', { sessionId, event, webhookId: webhook.id, deliveryId }, { sessionId, source: 'WebhookService' });
            await this.hookManager.execute('webhook:after', { sessionId, event, webhookId: webhook.id, success: true }, { sessionId, source: 'WebhookService' });
        }
        catch (error) {
            if (isLimiterClosed(error) || (0, exports.isAbortedBackoff)(error, ctx.signal))
                throw error;
            await this.hookManager.execute('webhook:error', { sessionId, event, webhookId: webhook.id, error: (0, ssrf_guard_1.redactSsrfError)(error, this.logger, 'webhook delivery') }, { sessionId, source: 'WebhookService' });
            this.logger.error(`Failed to deliver webhook ${webhook.id}`, String(error), {
                webhookId: webhook.id,
                action: 'webhook_delivery_failed',
            });
            return error instanceof UnrecordedWebhookFailure ? 'unrecorded' : 'failed';
        }
        return 'delivered';
    }
    async dispatchWithLimit(webhook, baseIdempotencyKey, ctx) {
        const { sessionId, event } = ctx;
        const deliveryId = (0, idempotency_util_1.generateDeliveryId)();
        const idempotencyKey = `${baseIdempotencyKey}_${webhook.id}`;
        await this.outbox.open({
            webhookId: webhook.id,
            sessionId,
            event,
            idempotencyKey,
            deliveryId,
            payload: ctx.baseData,
        });
        this.locallyPending.set(idempotencyKey, (this.locallyPending.get(idempotencyKey) ?? 0) + 1);
        try {
            await this.runLimited(webhook, deliveryId, idempotencyKey, ctx);
        }
        finally {
            const left = (this.locallyPending.get(idempotencyKey) ?? 1) - 1;
            if (left > 0)
                this.locallyPending.set(idempotencyKey, left);
            else
                this.locallyPending.delete(idempotencyKey);
        }
    }
    isLocallyPending(idempotencyKey) {
        return this.locallyPending.has(idempotencyKey);
    }
    gateFailingReceiver(webhook, sessionId, run) {
        if (this.queueEnabled || !this.failingWebhooks.has(webhook.id))
            return run(false);
        let gate = this.degradedSessionGates.get(sessionId);
        if (!gate) {
            gate = new concurrency_limiter_1.ConcurrencyLimiter(this.degradedSessionConcurrency, Math.max(1, Math.floor(this.dispatchMaxQueued / 4)));
            this.degradedSessionGates.set(sessionId, gate);
        }
        if (gate.activeCount >= this.degradedSessionConcurrency && this.parkedDeliveries() >= this.dispatchMaxQueued) {
            return Promise.reject(new Error('ConcurrencyLimiter queue full'));
        }
        const current = gate;
        return current
            .run(() => run(true))
            .finally(() => {
            if (current.activeCount === 0 &&
                current.queuedCount === 0 &&
                this.degradedSessionGates.get(sessionId) === current) {
                this.degradedSessionGates.delete(sessionId);
            }
        });
    }
    parkedDeliveries() {
        let parked = this.dispatchLimiter.queuedCount - this.dispatchLimiter.reacquiringCount;
        for (const gate of this.degradedSessionGates.values())
            parked += gate.queuedCount;
        return parked;
    }
    async runLimited(webhook, deliveryId, idempotencyKey, ctx) {
        const { sessionId, event } = ctx;
        const overBudget = this.inFlightDeliveries.size + this.parkedDeliveries() >= this.dispatchLimiter.maxCount + this.dispatchMaxQueued;
        const admitted = overBudget
            ? Promise.reject(new Error('ConcurrencyLimiter queue full'))
            : this.gateFailingReceiver(webhook, sessionId, gated => this.dispatchLimiter.run(async (yieldSlot) => {
                let target = webhook;
                if (gated) {
                    let row = webhook;
                    try {
                        row = await this.webhookRepository.findOne({ where: { id: webhook.id } });
                    }
                    catch (error) {
                        this.logger.warn('Could not re-read parked webhook; delivering with the dispatch-time row', {
                            webhookId: webhook.id,
                            event,
                            deliveryId,
                            idempotencyKey,
                            error: error instanceof Error ? error.message : String(error),
                            action: 'webhook_stale_check_failed',
                        });
                    }
                    if (!(0, deliver_once_1.isDeliverableWebhook)(row, event)) {
                        this.logger.warn('Skipping parked webhook delivery: webhook removed, disabled or unsubscribed', {
                            webhookId: webhook.id,
                            event,
                            deliveryId,
                            idempotencyKey,
                            action: 'webhook_skipped_stale',
                        });
                        this.failingWebhooks.delete(webhook.id);
                        await this.outbox.close(webhook.id, idempotencyKey, 'dispatched');
                        return;
                    }
                    target = row;
                }
                this.inFlightDeliveries.set(deliveryId, {
                    webhookId: webhook.id,
                    sessionId,
                    event,
                    idempotencyKey,
                    url: target.url,
                });
                try {
                    const outcome = await this.deliverOne(target, deliveryId, idempotencyKey, { ...ctx, yieldSlot });
                    if (outcome !== 'unrecorded' && outcome !== 'enqueued')
                        await this.outbox.close(webhook.id, idempotencyKey, 'dispatched');
                }
                finally {
                    this.inFlightDeliveries.delete(deliveryId);
                }
            }));
        await admitted.catch(async (error) => {
            if (error instanceof Error && error.message === 'ConcurrencyLimiter queue full') {
                await this.recordUndelivered(webhook, deliveryId, idempotencyKey, error, 'webhook_dispatch_capacity_exceeded', ctx);
                return;
            }
            if (error instanceof Error && error.message === 'ConcurrencyLimiter closed') {
                const record = this.recordUndelivered(webhook, deliveryId, idempotencyKey, error, 'webhook_dispatch_shutdown', ctx);
                this.pendingBookkeeping.add(record);
                try {
                    await record;
                }
                finally {
                    this.pendingBookkeeping.delete(record);
                }
                return;
            }
            throw error;
        });
    }
    async redeliver(webhook, sessionId, event, idempotencyKey, data, options = {}) {
        const deliveryId = (0, idempotency_util_1.generateDeliveryId)();
        const outcome = await this.deliverOne(webhook, deliveryId, idempotencyKey, {
            sessionId,
            event,
            baseData: data,
            singleAttempt: options.singleAttempt,
            oneDirectAttempt: options.oneDirectAttempt,
            signal: options.signal,
        });
        if (outcome === 'delivered')
            await this.outbox.close(webhook.id, idempotencyKey, 'dispatched');
        return outcome;
    }
    async isQueueJobPending(deliveryId) {
        if (!this.webhookQueue)
            return false;
        try {
            await (0, redis_connection_1.producerReady)(this.webhookQueue);
            const job = await this.webhookQueue.getJob(deliveryId);
            if (!job)
                return false;
            return !['completed', 'failed', 'unknown'].includes(await job.getState());
        }
        catch (error) {
            this.logger.warn('Could not inspect queued webhook delivery', { deliveryId, error: String(error) });
            return true;
        }
    }
    async hasQueueJobCompleted(deliveryId) {
        if (!this.webhookQueue)
            return false;
        try {
            await (0, redis_connection_1.producerReady)(this.webhookQueue);
            const job = await this.webhookQueue.getJob(deliveryId);
            return job ? (await job.getState()) === 'completed' : false;
        }
        catch (error) {
            this.logger.warn('Could not inspect queued webhook delivery', { deliveryId, error: String(error) });
            return false;
        }
    }
    async recordReplayExhaustion(row, url) {
        const existing = await this.failureRepository.count({
            where: { webhookId: row.webhookId, idempotencyKey: row.idempotencyKey, attempts: (0, typeorm_2.MoreThan)(0) },
        });
        if (existing > 0)
            return true;
        const unsent = await this.failureRepository.findOne({
            where: { webhookId: row.webhookId, idempotencyKey: row.idempotencyKey, attempts: 0 },
            select: { id: true, lastError: true },
        });
        const recorded = await (0, record_delivery_failure_1.recordWebhookDeliveryFailure)(this.failureRepository, this.logger, {
            webhookId: row.webhookId,
            sessionId: row.sessionId,
            event: row.event,
            url,
            idempotencyKey: row.idempotencyKey,
            attempts: Math.max(1, row.attempts),
            lastError: unsent?.lastError
                ? `Webhook replay budget exhausted; last error: ${unsent.lastError}`
                : 'Webhook replay budget exhausted',
            ...(this.keepsFailurePayload() ? { payload: row.payload } : {}),
        });
        if (recorded === true)
            (0, webhook_delivery_metrics_1.incrementWebhookDeliveryFailures)();
        return recorded !== null;
    }
    keepsFailurePayload() {
        return this.configService.get('webhook.failurePayloadRetentionHours', 0) > 0;
    }
    directOptions(ctx) {
        return {
            yieldSlot: ctx.yieldSlot,
            replayData: this.keepsFailurePayload() ? ctx.baseData : undefined,
            singleAttempt: ctx.singleAttempt || ctx.oneDirectAttempt,
            signal: ctx.signal,
        };
    }
    async deliverWebhook(webhook, payload, body, options = {}) {
        const yieldSlot = options.yieldSlot ?? ((fn) => fn());
        const delay = this.configService.get('webhook.retryDelay', 5000);
        let current = webhook;
        for (let attempt = 1;; attempt++) {
            try {
                const row = await this.webhookRepository.findOne({ where: { id: webhook.id } });
                if (!(0, deliver_once_1.isDeliverableWebhook)(row, payload.event, payload.sessionId)) {
                    this.logger.warn('Skipping webhook delivery: webhook removed, disabled, unsubscribed or reassigned', {
                        webhookId: webhook.id,
                        event: payload.event,
                        deliveryId: payload.deliveryId,
                        idempotencyKey: payload.idempotencyKey,
                        action: 'webhook_skipped_stale',
                    });
                    this.failingWebhooks.delete(webhook.id);
                    return false;
                }
                current = row;
                const headers = (0, deliver_once_1.buildDeliveryHeaders)(current, payload.event, payload.idempotencyKey, payload.deliveryId, body, attempt - 1);
                if (attempt > 1)
                    options.signal?.throwIfAborted();
                await (0, deliver_once_1.postWebhookPayload)(current.url, body, headers, this.configService.get('webhook.timeout', 10000));
                this.failingWebhooks.delete(webhook.id);
                try {
                    await this.webhookRepository.update(webhook.id, {
                        lastTriggeredAt: new Date(),
                    });
                }
                catch (bookkeepingError) {
                    this.logger.error(`Webhook delivered to ${webhook.id} but lastTriggeredAt update failed`, bookkeepingError instanceof Error ? bookkeepingError.message : String(bookkeepingError), { webhookId: webhook.id, deliveryId: payload.deliveryId, action: 'webhook_bookkeeping_failed' });
                }
                await (0, record_delivery_failure_1.clearDeliveryFailureRows)(this.failureRepository, this.logger, webhook.id, payload.idempotencyKey);
                this.logger.debug(`Webhook delivered to ${webhook.id}`, {
                    webhookId: webhook.id,
                    deliveryId: payload.deliveryId,
                    action: 'webhook_delivered',
                });
                return true;
            }
            catch (error) {
                if ((0, exports.isAbortedBackoff)(error, options.signal))
                    throw error;
                this.failingWebhooks.add(webhook.id);
                this.logger.error(`Webhook delivery failed for ${webhook.id}`, String(error), {
                    webhookId: webhook.id,
                    attempt,
                    deliveryId: payload.deliveryId,
                    action: 'webhook_delivery_failed',
                });
                if (attempt < (options.singleAttempt ? 1 : current.retryCount)) {
                    await yieldSlot(() => (0, promises_1.setTimeout)(delay * 2 ** (attempt - 1), undefined, { signal: options.signal }));
                    continue;
                }
                const recorded = await (0, deliver_once_1.recordTerminalFailure)(this.failureRepository, this.logger, {
                    webhookId: webhook.id,
                    sessionId: payload.sessionId,
                    event: payload.event,
                    url: current.url,
                    idempotencyKey: payload.idempotencyKey,
                    deliveryId: payload.deliveryId,
                    attempts: attempt,
                    error,
                    ...(options.replayData ? { payload: options.replayData } : {}),
                });
                if (recorded !== false)
                    (0, webhook_delivery_metrics_1.incrementWebhookDeliveryFailures)();
                if (recorded === null)
                    throw new UnrecordedWebhookFailure((0, ssrf_guard_1.redactSsrfError)(error));
                throw error;
            }
        }
    }
};
exports.WebhookDeliveryService = WebhookDeliveryService;
exports.WebhookDeliveryService = WebhookDeliveryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(webhook_entity_1.Webhook, 'data')),
    __param(1, (0, typeorm_1.InjectRepository)(webhook_delivery_failure_entity_1.WebhookDeliveryFailure, 'data')),
    __param(5, (0, common_1.Optional)()),
    __param(6, (0, common_1.Optional)()),
    __param(6, (0, bullmq_1.InjectQueue)(queue_names_1.QUEUE_NAMES.WEBHOOK)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        config_1.ConfigService,
        hooks_1.HookManager,
        webhook_outbox_service_1.WebhookOutboxService,
        lid_mapping_store_service_1.LidMappingStoreService,
        bullmq_2.Queue])
], WebhookDeliveryService);
//# sourceMappingURL=webhook-delivery.service.js.map