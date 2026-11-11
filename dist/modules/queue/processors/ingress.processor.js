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
exports.IngressProcessor = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const queue_names_1 = require("../queue-names");
const redis_connection_1 = require("../redis-connection");
const close_worker_1 = require("./close-worker");
const integration_delivery_failure_entity_1 = require("../../integration/entities/integration-delivery-failure.entity");
const ingress_event_entity_1 = require("../../integration/entities/ingress-event.entity");
const plugin_loader_service_1 = require("../../../core/plugins/plugin-loader.service");
const hooks_1 = require("../../../core/hooks");
const logger_service_1 = require("../../../common/services/logger.service");
const shutdown_service_1 = require("../../../common/services/shutdown.service");
const ordering_lock_1 = require("../../integration/ordering-lock");
const ingress_enqueue_service_1 = require("../../integration/ingress-enqueue.service");
const STALL_EXHAUSTION_MESSAGE = 'job stalled more than allowable limit';
const REQUEUE_DELAY_MS = 60_000;
const REQUEUED_JOB_ID = /-requeued-[12]$/;
let IngressProcessor = class IngressProcessor extends bullmq_1.WorkerHost {
    loader;
    failures;
    hooks;
    ingressQueue;
    events;
    logger = (0, logger_service_1.createLogger)('IngressProcessor');
    lock = new ordering_lock_1.KeyedAsyncLock();
    constructor(loader, failures, hooks, ingressQueue, events, shutdown) {
        super();
        this.loader = loader;
        this.failures = failures;
        this.hooks = hooks;
        this.ingressQueue = ingressQueue;
        this.events = events;
        shutdown?.onShutdown(() => {
            const worker = (0, close_worker_1.startedWorker)(this);
            void worker?.close().catch(() => undefined);
        });
    }
    async onModuleDestroy() {
        await (0, close_worker_1.closeWorkerIfStarted)(this, close_worker_1.MAX_WORKER_CLOSE_WAIT_MS);
    }
    async process(job, token) {
        const d = job.data;
        if (this.loader.isRestorePending(d.pluginId)) {
            const delay = Math.max(1000, (0, ingress_enqueue_service_1.resolveIngressJobOptions)().backoff.delay);
            await job.moveToDelayed((Math.floor(Date.now() / delay) + 1) * delay, token);
            throw new bullmq_2.DelayedError();
        }
        try {
            await this.lock.run((0, ordering_lock_1.orderingKeyFor)(d), () => this.loader.dispatchWebhookForInstance(d));
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            const isFinalAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);
            this.logger.error('Ingress dispatch failed', errorMessage, {
                pluginId: d.pluginId,
                instanceId: d.instanceId,
                route: d.route,
                deliveryId: d.deliveryId,
                attempt: job.attemptsMade + 1,
                isFinalAttempt,
                action: 'ingress_dispatch_failed',
            });
            if (isFinalAttempt)
                await this.deadLetterOrRequeue(job, job.attemptsMade + 1, errorMessage);
            if (errorMessage === bullmq_2.RATE_LIMIT_ERROR) {
                throw new Error(`Ingress dispatch failed: ${errorMessage}`, { cause: err });
            }
            throw err;
        }
        if (REQUEUED_JOB_ID.test(String(job.id)))
            await this.settleRequeued(d);
    }
    async settleRequeued(d) {
        try {
            await this.events.update({ pluginId: d.pluginId, instanceId: d.instanceId, providerDeliveryId: d.deliveryId }, { dispatchState: 'dispatched', payload: null });
            await this.failures.update({
                direction: 'inbound',
                pluginId: d.pluginId,
                instanceId: d.instanceId,
                deliveryId: d.deliveryId,
                redriven: false,
            }, { redriven: true });
        }
        catch (err) {
            this.logger.error('Could not record a re-queued ingress delivery', err instanceof Error ? err.message : String(err), {
                pluginId: d.pluginId,
                instanceId: d.instanceId,
                deliveryId: d.deliveryId,
                action: 'ingress_requeue_settle_failed',
            });
        }
    }
    async onWorkerFailed(job, error) {
        if (!job || job.deferredFailure !== STALL_EXHAUSTION_MESSAGE || error.message !== STALL_EXHAUSTION_MESSAGE)
            return;
        const d = job.data;
        this.logger.error('Ingress job failed after stalling beyond the recovery limit', error.message, {
            pluginId: d.pluginId,
            instanceId: d.instanceId,
            route: d.route,
            deliveryId: d.deliveryId,
            attemptsMade: job.attemptsMade,
            action: 'ingress_stall_exhausted',
        });
        await this.deadLetterOrRequeue(job, job.attemptsMade, error.message);
    }
    async deadLetterOrRequeue(job, attempts, errorMessage) {
        const d = job.data;
        try {
            await this.deadLetter(d, attempts, errorMessage, REQUEUED_JOB_ID.test(String(job.id)));
        }
        catch (err) {
            const meta = { jobId: job.id, pluginId: d.pluginId, instanceId: d.instanceId, deliveryId: d.deliveryId };
            const reason = err instanceof Error ? err.message : String(err);
            try {
                const [first, second] = (0, ingress_enqueue_service_1.requeuedJobIds)(String(job.id).replace(REQUEUED_JOB_ID, ''));
                const jobId = String(job.id) === first ? second : first;
                await (0, redis_connection_1.producerReady)(this.ingressQueue);
                await this.ingressQueue.remove(jobId);
                await this.ingressQueue.add(job.name, d, {
                    jobId,
                    attempts: job.opts.attempts,
                    backoff: job.opts.backoff,
                    delay: REQUEUE_DELAY_MS,
                });
                this.logger.error('Could not dead-letter a failed ingress job; re-queued it', reason, {
                    ...meta,
                    action: 'ingress_dlq_failed_requeued',
                });
            }
            catch (queueErr) {
                this.logger.error('Could not dead-letter or re-queue a failed ingress job', reason, {
                    ...meta,
                    requeueError: queueErr instanceof Error ? queueErr.message : String(queueErr),
                    action: 'ingress_dlq_failed',
                });
            }
        }
    }
    async deadLetter(d, attempts, errorMessage, requeued) {
        await this.hooks.execute('ingress:error', { ...d, error: errorMessage }, { sessionId: d.sessionId, source: 'IngressProcessor' });
        if (requeued &&
            (await this.failures.count({
                where: {
                    direction: 'inbound',
                    pluginId: d.pluginId,
                    instanceId: d.instanceId,
                    deliveryId: d.deliveryId,
                    redriven: false,
                },
            })) > 0) {
            return;
        }
        await this.failures.save({
            direction: 'inbound',
            pluginId: d.pluginId,
            instanceId: d.instanceId,
            sessionId: d.sessionId ?? null,
            deliveryId: d.deliveryId,
            attempts,
            lastError: errorMessage,
            payload: {
                route: d.route,
                method: d.method,
                providerConversationId: d.providerConversationId,
                ingress: d.payload,
            },
            redriven: false,
        });
    }
};
exports.IngressProcessor = IngressProcessor;
__decorate([
    (0, bullmq_1.OnWorkerEvent)('failed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Error]),
    __metadata("design:returntype", Promise)
], IngressProcessor.prototype, "onWorkerFailed", null);
exports.IngressProcessor = IngressProcessor = __decorate([
    (0, bullmq_1.Processor)(queue_names_1.QUEUE_NAMES.INGRESS, { connection: (0, redis_connection_1.workerConnectionOptions)(), concurrency: (0, redis_connection_1.ingressWorkerConcurrency)() }),
    __param(1, (0, typeorm_1.InjectRepository)(integration_delivery_failure_entity_1.IntegrationDeliveryFailure, 'data')),
    __param(3, (0, bullmq_1.InjectQueue)(queue_names_1.QUEUE_NAMES.INGRESS)),
    __param(4, (0, typeorm_1.InjectRepository)(ingress_event_entity_1.IngressEvent, 'data')),
    __param(5, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [plugin_loader_service_1.PluginLoaderService,
        typeorm_2.Repository,
        hooks_1.HookManager,
        bullmq_2.Queue,
        typeorm_2.Repository,
        shutdown_service_1.ShutdownService])
], IngressProcessor);
//# sourceMappingURL=ingress.processor.js.map