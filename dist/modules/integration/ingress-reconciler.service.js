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
exports.IngressReconcilerService = void 0;
exports.resolveIngressReconcilerOptions = resolveIngressReconcilerOptions;
const promises_1 = require("node:timers/promises");
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const ingress_event_entity_1 = require("./entities/ingress-event.entity");
const integration_delivery_failure_entity_1 = require("./entities/integration-delivery-failure.entity");
const plugin_instance_entity_1 = require("./entities/plugin-instance.entity");
const session_entity_1 = require("../session/entities/session.entity");
const ingress_enqueue_service_1 = require("./ingress-enqueue.service");
const ingress_service_1 = require("./ingress.service");
const integration_constants_1 = require("./integration.constants");
const plugin_instance_service_1 = require("./plugin-instance.service");
const plugin_loader_service_1 = require("../../core/plugins/plugin-loader.service");
const logger_service_1 = require("../../common/services/logger.service");
const db_errors_1 = require("../../common/utils/db-errors");
const configuration_1 = require("../../config/configuration");
function resolveIngressReconcilerOptions(env = process.env) {
    const batch = Number(env.INGRESS_RECONCILE_BATCH_SIZE);
    const maxAttempts = Number(env.INGRESS_RECONCILE_MAX_ATTEMPTS);
    return {
        intervalMs: (0, configuration_1.resolveNonNegativeIntEnv)(env.INGRESS_RECONCILE_INTERVAL_MS, 60_000),
        graceMs: (0, configuration_1.resolveNonNegativeIntEnv)(env.INGRESS_RECONCILE_GRACE_MS, 60_000),
        batchSize: Number.isInteger(batch) && batch >= 1 ? batch : 50,
        maxAttempts: Number.isInteger(maxAttempts) && maxAttempts >= 1 ? maxAttempts : 5,
    };
}
const UNREADABLE_RETRY_MS = 60 * 60 * 1000;
const UNREADABLE_REMEMBERED_MAX = 1000;
let IngressReconcilerService = class IngressReconcilerService {
    events;
    failures;
    ingressEnqueue;
    loader;
    instances;
    logger = (0, logger_service_1.createLogger)('IngressReconcilerService');
    timer;
    inFlight;
    stop = new AbortController();
    unreadableUntil = new Map();
    constructor(events, failures, ingressEnqueue, loader, instances) {
        this.events = events;
        this.failures = failures;
        this.ingressEnqueue = ingressEnqueue;
        this.loader = loader;
        this.instances = instances;
    }
    onModuleInit() {
        const opts = resolveIngressReconcilerOptions();
        if (opts.intervalMs <= 0) {
            this.logger.log('Ingress event reconciler disabled (INGRESS_RECONCILE_INTERVAL_MS=0)');
            return;
        }
        this.timer = setInterval(() => {
            this.sweep(opts).catch(err => this.logger.error('Ingress reconcile sweep failed', err instanceof Error ? err.stack : String(err)));
        }, opts.intervalMs);
        this.timer.unref?.();
    }
    async onModuleDestroy() {
        this.stop.abort();
        if (this.timer)
            clearInterval(this.timer);
        if (!this.inFlight)
            return;
        let timer;
        const settled = await Promise.race([
            this.inFlight.then(() => true),
            new Promise(resolve => (timer = setTimeout(resolve, integration_constants_1.INGRESS_DISPATCH_TIMEOUT_MS, false))),
        ]);
        clearTimeout(timer);
        if (!settled) {
            this.logger.warn('Ingress reconcile pass still running at shutdown; continuing without it', {
                waitMs: integration_constants_1.INGRESS_DISPATCH_TIMEOUT_MS,
                action: 'ingress_reconcile_shutdown_timeout',
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
            const unreadable = this.unreadableRows(now);
            const restoring = this.loader.restorePendingIds();
            const query = this.events
                .createQueryBuilder('e')
                .select('e.id')
                .innerJoin(plugin_instance_entity_1.PluginInstance, 'pi', 'pi.pluginId = e.pluginId AND pi.instanceId = e.instanceId AND pi.enabled = :enabled', { enabled: true })
                .where('e.dispatchState = :state', { state: 'pending' })
                .andWhere('e.createdAt < :cutoff', { cutoff })
                .andWhere('e.payload IS NOT NULL');
            if (unreadable.length)
                query.andWhere('e.id NOT IN (:...unreadable)', { unreadable });
            if (restoring.length)
                query.andWhere('e.pluginId NOT IN (:...restoring)', { restoring });
            const batch = await query.orderBy('e.createdAt', 'ASC').limit(opts.batchSize).getMany();
            for (const { id } of batch) {
                if (this.stop.signal.aborted)
                    break;
                let row;
                try {
                    row = await this.events.findOneBy({ id });
                }
                catch (err) {
                    this.logger.error('Ingress reconcile row failed', err instanceof Error ? err.message : String(err), {
                        id,
                        action: 'ingress_reconcile_row_unreadable',
                    });
                    if ((err instanceof Error && err.name === 'SyntaxError') || !(0, db_errors_1.isTransientDbError)(err)) {
                        this.rememberUnreadable(id, now);
                    }
                    stats.skipped++;
                    continue;
                }
                if (!row || row.dispatchState !== 'pending')
                    continue;
                if (row.lastDispatchAt && row.lastDispatchAt > cutoff) {
                    stats.skipped++;
                    continue;
                }
                if (!hasPayload(row)) {
                    this.logger.error('Ingress event is pending without a payload; cannot replay', undefined, {
                        pluginId: row.pluginId,
                        instanceId: row.instanceId,
                        deliveryId: row.providerDeliveryId,
                        action: 'ingress_reconcile_missing_payload',
                    });
                    stats.skipped++;
                    continue;
                }
                try {
                    const instance = await this.instances.resolve(row.pluginId, row.instanceId);
                    if (!instance || !instance.enabled) {
                        this.logger.log('Skipping ingress event for a disabled or deleted instance', {
                            pluginId: row.pluginId,
                            instanceId: row.instanceId,
                            deliveryId: row.providerDeliveryId,
                            action: 'ingress_reconcile_instance_ineligible',
                        });
                        stats.skipped++;
                        continue;
                    }
                    if (this.loader.isRestorePending(row.pluginId)) {
                        stats.skipped++;
                        continue;
                    }
                    stats.scanned++;
                    const outcome = await this.reconcileRow(row, opts.maxAttempts, now);
                    if (outcome === 'replayed')
                        stats.replayed++;
                    else if (outcome === 'failed')
                        stats.failed++;
                    else
                        stats.skipped++;
                }
                catch (err) {
                    this.logger.error('Ingress reconcile row failed', err instanceof Error ? err.message : String(err), {
                        pluginId: row.pluginId,
                        instanceId: row.instanceId,
                        deliveryId: row.providerDeliveryId,
                        action: 'ingress_reconcile_row_failed',
                    });
                    stats.skipped++;
                }
            }
            return stats;
        }
        finally {
            this.inFlight = undefined;
            settle();
        }
    }
    unreadableRows(now) {
        for (const [id, until] of this.unreadableUntil) {
            if (until <= now.getTime())
                this.unreadableUntil.delete(id);
        }
        return [...this.unreadableUntil.keys()];
    }
    rememberUnreadable(id, now) {
        this.unreadableUntil.delete(id);
        this.unreadableUntil.set(id, now.getTime() + UNREADABLE_RETRY_MS);
        while (this.unreadableUntil.size > UNREADABLE_REMEMBERED_MAX) {
            const oldest = this.unreadableUntil.keys().next().value;
            this.unreadableUntil.delete(oldest);
        }
    }
    async deadLetterAgedPending(cutoff, batchSize = 100) {
        while (this.inFlight && !this.stop.signal.aborted)
            await this.inFlight;
        if (this.stop.signal.aborted)
            return 0;
        let settle;
        this.inFlight = new Promise(resolve => (settle = resolve));
        let retired = 0;
        const kept = [];
        try {
            for (;;) {
                const rows = await this.events.find({
                    select: { id: true },
                    where: {
                        dispatchState: 'pending',
                        createdAt: (0, typeorm_2.LessThan)(cutoff),
                        payload: (0, typeorm_2.Not)((0, typeorm_2.IsNull)()),
                        ...(kept.length ? { id: (0, typeorm_2.Not)((0, typeorm_2.In)(kept)) } : {}),
                    },
                    order: { createdAt: 'ASC' },
                    take: batchSize,
                });
                for (const { id } of rows) {
                    await (0, promises_1.setImmediate)();
                    if (this.stop.signal.aborted)
                        return retired;
                    let row;
                    try {
                        row = await this.events.findOneBy({ id });
                    }
                    catch (err) {
                        kept.push(id);
                        this.logger.error('Failed to read an undispatched ingress event; kept for the next run', err instanceof Error ? err.message : String(err), { id, action: 'ingress_event_retention_unreadable' });
                        continue;
                    }
                    if (!row || row.dispatchState !== 'pending')
                        continue;
                    if (!hasPayload(row)) {
                        kept.push(row.id);
                        continue;
                    }
                    const meta = { pluginId: row.pluginId, instanceId: row.instanceId, deliveryId: row.providerDeliveryId };
                    try {
                        if (await this.ownerDeleted(row)) {
                            await this.events.update({ id: row.id, dispatchState: 'pending' }, { dispatchState: 'failed', payload: null });
                            this.logger.warn('Undispatched ingress event of a deleted instance or session dropped', {
                                ...meta,
                                action: 'ingress_event_retention_dropped',
                            });
                            continue;
                        }
                        const jobData = this.jobDataFor(row);
                        const existing = await this.ingressEnqueue.existingJobState(jobData, row.providerDeliveryId);
                        if (this.stop.signal.aborted)
                            return retired;
                        if (existing && existing !== 'failed') {
                            const settled = await this.events.update({ id: row.id, dispatchState: 'pending' }, { dispatchState: 'dispatched', payload: null });
                            if (settled.affected)
                                await this.retireOpenDeadLetters(row);
                            continue;
                        }
                        const written = await this.ensureDeadLetterRow(jobData, row.dispatchAttempts, 'not dispatched within the ingress dedup retention window');
                        const marked = await this.events.update({ id: row.id, dispatchState: 'pending' }, { dispatchState: 'failed', payload: null });
                        if (written)
                            await this.settleDeadLetter(row, written, marked);
                        if (!marked.affected)
                            continue;
                        retired++;
                        this.logger.warn('Ingress event was never dispatched within the dedup retention window; dead-lettered', {
                            ...meta,
                            action: 'ingress_event_retention_dead_lettered',
                        });
                    }
                    catch (err) {
                        kept.push(row.id);
                        this.logger.error('Failed to dead-letter an undispatched ingress event; kept for the next run', err instanceof Error ? err.message : String(err), { ...meta, action: 'ingress_event_retention_dead_letter_failed' });
                    }
                }
                if (rows.length < batchSize)
                    return retired;
                if (kept.length >= 10 * batchSize) {
                    this.logger.warn('Ingress retention hand-off stopped early; the remaining events wait for the next run', {
                        kept: kept.length,
                        action: 'ingress_event_retention_handoff_stopped',
                    });
                    return retired;
                }
            }
        }
        finally {
            this.inFlight = undefined;
            settle();
        }
    }
    async ownerDeleted(row) {
        if (!(await this.instances.resolve(row.pluginId, row.instanceId)))
            return true;
        const sessionId = row.sessionId;
        return !!sessionId && (0, class_validator_1.isUUID)(sessionId) && !(await this.events.manager.existsBy(session_entity_1.Session, { id: sessionId }));
    }
    async settleDeadLetter(row, written, marked) {
        const state = marked.affected
            ? 'failed'
            : (await this.events.findOne({ where: { id: row.id }, select: { dispatchState: true } }))?.dispatchState;
        if (written && (state === 'dispatched' || (state === 'failed' && (await this.hasOpenDeadLetter(row, written))))) {
            await this.failures.update({ id: written, redriven: false }, { redriven: true });
        }
        return state;
    }
    async hasOpenDeadLetter(row, below) {
        const open = await this.failures.count({
            where: {
                direction: 'inbound',
                pluginId: row.pluginId,
                instanceId: row.instanceId,
                deliveryId: row.providerDeliveryId,
                redriven: false,
                ...(below !== undefined && { id: (0, typeorm_2.LessThan)(below) }),
            },
        });
        return open > 0;
    }
    async retireOpenDeadLetters(row) {
        await this.failures.update({
            direction: 'inbound',
            pluginId: row.pluginId,
            instanceId: row.instanceId,
            deliveryId: row.providerDeliveryId,
            redriven: false,
        }, { redriven: true });
    }
    async reconcileRow(row, maxAttempts, now) {
        const jobData = this.jobDataFor(row);
        const existing = await this.ingressEnqueue.existingJobState(jobData, row.providerDeliveryId);
        if (this.stop.signal.aborted)
            return 'interrupted';
        if (existing === 'failed') {
            const written = await this.ensureDeadLetterRow(jobData, (0, ingress_enqueue_service_1.resolveIngressJobOptions)().attempts, 'ingress queue job failed');
            const marked = await this.events.update({ id: row.id, dispatchState: 'pending' }, { lastDispatchAt: now, dispatchState: 'failed', payload: null });
            if (await this.settledElsewhere(row, written, marked))
                return 'replayed';
            this.logger.warn('Stranded ingress event already failed in the queue; left for redrive', {
                pluginId: row.pluginId,
                instanceId: row.instanceId,
                deliveryId: row.providerDeliveryId,
                action: 'ingress_event_reconcile_job_failed',
            });
            return 'failed';
        }
        const result = existing
            ? { outcome: 'queued' }
            : await this.ingressEnqueue.enqueue(jobData, row.providerDeliveryId, this.stop.signal).catch(err => {
                if (this.stop.signal.aborted)
                    return undefined;
                throw err;
            });
        if (!result)
            return 'interrupted';
        const { outcome, error } = result;
        if (outcome !== 'failed') {
            await this.events.update({ id: row.id }, { dispatchState: 'dispatched', lastDispatchAt: now, payload: null });
            await this.retireOpenDeadLetters(row);
            this.logger.log('Replayed stranded ingress event', {
                pluginId: row.pluginId,
                instanceId: row.instanceId,
                deliveryId: row.providerDeliveryId,
                outcome,
                action: 'ingress_event_replayed',
            });
            return 'replayed';
        }
        if (this.stop.signal.aborted)
            return 'interrupted';
        const attempts = (row.dispatchAttempts ?? 0) + 1;
        const terminal = attempts >= maxAttempts;
        if (terminal) {
            const written = await this.ensureDeadLetterRow(jobData, attempts, error);
            const marked = await this.events.update({ id: row.id, dispatchState: 'pending' }, { dispatchAttempts: attempts, lastDispatchAt: now, dispatchState: 'failed', payload: null });
            if (await this.settledElsewhere(row, written, marked))
                return 'replayed';
            this.logger.warn('Ingress event replay budget exhausted; event is dead-lettered', {
                pluginId: row.pluginId,
                instanceId: row.instanceId,
                deliveryId: row.providerDeliveryId,
                attempts,
                action: 'ingress_event_reconcile_exhausted',
            });
            return 'failed';
        }
        await this.events.update({ id: row.id }, { dispatchAttempts: attempts, lastDispatchAt: now });
        return 'failed';
    }
    async settledElsewhere(row, written, marked) {
        const state = await this.settleDeadLetter(row, written, marked);
        return state === 'dispatched' && !(await this.hasOpenDeadLetter(row));
    }
    jobDataFor(row) {
        const route = this.loader
            .getPlugin(row.pluginId)
            ?.manifest.ingress?.find(candidate => candidate.route === row.route);
        const { method, ...payload } = row.payload;
        return {
            pluginId: row.pluginId,
            instanceId: row.instanceId,
            route: row.route,
            method,
            deliveryId: row.providerDeliveryId,
            sessionId: row.sessionId ?? undefined,
            providerConversationId: (0, ingress_service_1.extractConversationId)(route?.conversationId, payload.headers, payload.rawBody),
            payload,
        };
    }
    async ensureDeadLetterRow(data, attempts, error) {
        const existing = await this.failures.count({
            where: {
                direction: 'inbound',
                pluginId: data.pluginId,
                instanceId: data.instanceId,
                deliveryId: data.deliveryId,
                redriven: false,
            },
        });
        if (existing > 0)
            return undefined;
        return (await this.failures.save({ ...(0, ingress_enqueue_service_1.buildIngressDeadLetterRow)(data, error), attempts })).id;
    }
};
exports.IngressReconcilerService = IngressReconcilerService;
exports.IngressReconcilerService = IngressReconcilerService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(ingress_event_entity_1.IngressEvent, 'data')),
    __param(1, (0, typeorm_1.InjectRepository)(integration_delivery_failure_entity_1.IntegrationDeliveryFailure, 'data')),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        ingress_enqueue_service_1.IngressEnqueueService,
        plugin_loader_service_1.PluginLoaderService,
        plugin_instance_service_1.PluginInstanceService])
], IngressReconcilerService);
function hasPayload(row) {
    return row.payload !== null;
}
//# sourceMappingURL=ingress-reconciler.service.js.map