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
exports.IngressEnqueueService = void 0;
exports.resolveIngressJobOptions = resolveIngressJobOptions;
exports.sanitizeIngressJobId = sanitizeIngressJobId;
exports.requeuedJobIds = requeuedJobIds;
exports.buildIngressDeadLetterRow = buildIngressDeadLetterRow;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const crypto_1 = require("crypto");
const plugin_loader_service_1 = require("../../core/plugins/plugin-loader.service");
const queue_names_1 = require("../queue/queue-names");
const redis_connection_1 = require("../queue/redis-connection");
const logger_service_1 = require("../../common/services/logger.service");
const configuration_1 = require("../../config/configuration");
function resolveIngressJobOptions() {
    return {
        attempts: (0, configuration_1.resolveNonNegativeIntEnv)(process.env.INGRESS_MAX_ATTEMPTS, 0) || 3,
        backoff: { type: 'exponential', delay: (0, configuration_1.resolveNonNegativeIntEnv)(process.env.INGRESS_RETRY_DELAY_MS, 5000) },
    };
}
function sanitizeIngressJobId(jobId, namespace = '') {
    const raw = typeof jobId === 'string' ? jobId : String(jobId);
    return `ing-${(0, crypto_1.createHash)('sha256').update(`${namespace}\u0000${raw}`).digest('hex').slice(0, 40)}`;
}
function queueJobId(data, jobId) {
    return sanitizeIngressJobId(jobId, `${data.pluginId}\u0000${data.instanceId}`);
}
function requeuedJobIds(baseJobId) {
    return [`${baseJobId}-requeued-1`, `${baseJobId}-requeued-2`];
}
const isLiveOrCompleted = (state) => state !== 'failed' && state !== 'unknown';
function buildIngressDeadLetterRow(data, error) {
    return {
        direction: 'inbound',
        pluginId: data.pluginId,
        instanceId: data.instanceId,
        sessionId: data.sessionId ?? null,
        deliveryId: data.deliveryId,
        attempts: 1,
        lastError: error ?? 'inline ingress dispatch failed',
        payload: {
            route: data.route,
            method: data.method,
            providerConversationId: data.providerConversationId,
            ingress: data.payload,
        },
        redriven: false,
    };
}
let IngressEnqueueService = class IngressEnqueueService {
    loader;
    config;
    ingressQueue;
    logger = (0, logger_service_1.createLogger)('IngressEnqueueService');
    constructor(loader, config, ingressQueue) {
        this.loader = loader;
        this.config = config;
        this.ingressQueue = ingressQueue;
    }
    onApplicationBootstrap() {
        if (process.env.QUEUE_ENABLED === 'true' && !this.ingressQueue) {
            throw new Error(`QUEUE_ENABLED=true but the '${queue_names_1.QUEUE_NAMES.INGRESS}' BullMQ queue did not resolve — ` +
                'IntegrationModule must import QueueModule (see the QUEUE_ENABLED conditional in integration.module.ts). ' +
                'Refusing to boot: ingress deliveries would silently dispatch inline, defeating the queued-dispatch contract.');
        }
    }
    defersInlineDispatch(pluginId) {
        const queued = this.config.get('queue.enabled', false) && !!this.ingressQueue;
        return !queued && this.loader.isRestorePending(pluginId);
    }
    async existingJobState(data, jobId) {
        if (!this.config.get('queue.enabled', false) || !this.ingressQueue)
            return undefined;
        try {
            await (0, redis_connection_1.producerReady)(this.ingressQueue);
            const id = queueJobId(data, jobId);
            const state = await this.ingressQueue.getJobState(id);
            if (isLiveOrCompleted(state))
                return state;
            for (const copyId of requeuedJobIds(id)) {
                const copyState = await this.ingressQueue.getJobState(copyId);
                if (isLiveOrCompleted(copyState))
                    return copyState;
            }
            return state === 'unknown' ? undefined : state;
        }
        catch (err) {
            this.logger.warn('Ingress job state lookup failed', {
                pluginId: data.pluginId,
                instanceId: data.instanceId,
                deliveryId: data.deliveryId,
                error: err instanceof Error ? err.message : String(err),
                action: 'ingress_job_state_lookup_failed',
            });
            return undefined;
        }
    }
    async enqueue(data, jobId, signal) {
        const queueEnabled = this.config.get('queue.enabled', false);
        const useQueue = queueEnabled && !!this.ingressQueue;
        if (useQueue && this.ingressQueue) {
            try {
                await (0, redis_connection_1.producerReady)(this.ingressQueue);
                await this.ingressQueue.add('ingress', data, {
                    jobId: queueJobId(data, jobId),
                    ...resolveIngressJobOptions(),
                });
                return { outcome: 'queued' };
            }
            catch (err) {
                signal?.throwIfAborted();
                this.logger.error('Ingress queue add failed; dispatching inline', err instanceof Error ? err.message : String(err), {
                    pluginId: data.pluginId,
                    instanceId: data.instanceId,
                    route: data.route,
                    deliveryId: data.deliveryId,
                    action: 'ingress_queue_add_failed',
                });
            }
        }
        try {
            await this.loader.dispatchWebhookForInstance(data);
            return { outcome: 'dispatched' };
        }
        catch (err) {
            const error = err instanceof Error ? err.message : String(err);
            this.logger.error('Inline ingress dispatch failed', error, {
                pluginId: data.pluginId,
                instanceId: data.instanceId,
                route: data.route,
                deliveryId: data.deliveryId,
                action: 'ingress_inline_dispatch_failed',
            });
            return { outcome: 'failed', error };
        }
    }
};
exports.IngressEnqueueService = IngressEnqueueService;
exports.IngressEnqueueService = IngressEnqueueService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Optional)()),
    __param(2, (0, bullmq_1.InjectQueue)(queue_names_1.QUEUE_NAMES.INGRESS)),
    __metadata("design:paramtypes", [plugin_loader_service_1.PluginLoaderService,
        config_1.ConfigService,
        bullmq_2.Queue])
], IngressEnqueueService);
//# sourceMappingURL=ingress-enqueue.service.js.map