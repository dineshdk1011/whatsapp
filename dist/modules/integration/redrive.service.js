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
exports.RedriveService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const integration_delivery_failure_entity_1 = require("./entities/integration-delivery-failure.entity");
const ingress_event_entity_1 = require("./entities/ingress-event.entity");
const ingress_enqueue_service_1 = require("./ingress-enqueue.service");
const ordering_lock_1 = require("./ordering-lock");
const integration_constants_1 = require("./integration.constants");
const logger_service_1 = require("../../common/services/logger.service");
const plugin_activation_1 = require("../../core/plugins/plugin-activation");
const REDRIVE_BATCH_SIZE = 100;
let RedriveService = class RedriveService {
    repo;
    events;
    ingressEnqueue;
    logger = (0, logger_service_1.createLogger)('IntegrationRedrive');
    lock = new ordering_lock_1.KeyedAsyncLock();
    stop = new AbortController();
    inFlight = new Set();
    constructor(repo, events, ingressEnqueue) {
        this.repo = repo;
        this.events = events;
        this.ingressEnqueue = ingressEnqueue;
    }
    async onModuleDestroy() {
        this.stop.abort();
        if (this.inFlight.size === 0)
            return;
        let timer;
        const settled = await Promise.race([
            Promise.allSettled([...this.inFlight]).then(() => true),
            new Promise(resolve => (timer = setTimeout(resolve, integration_constants_1.INGRESS_DISPATCH_TIMEOUT_MS, false))),
        ]);
        clearTimeout(timer);
        if (!settled) {
            this.logger.warn('Ingress redrive still running at shutdown; continuing without it', {
                waitMs: integration_constants_1.INGRESS_DISPATCH_TIMEOUT_MS,
                action: 'ingress_redrive_shutdown_timeout',
            });
        }
    }
    redriveInstance(pluginId, instanceId, sessionScope) {
        const run = this.lock.run(`redrive:${pluginId}:${instanceId}`, () => this.redriveBatch(pluginId, instanceId, sessionScope));
        this.inFlight.add(run);
        const forget = () => void this.inFlight.delete(run);
        run.then(forget, forget);
        return run;
    }
    async redriveBatch(pluginId, instanceId, sessionScope) {
        const base = { pluginId, instanceId, direction: 'inbound', redriven: false };
        const where = (0, plugin_activation_1.isAllSessionsScope)(sessionScope)
            ? [
                { ...base, sessionId: (0, typeorm_2.IsNull)() },
                { ...base, sessionId: '*' },
            ]
            : { ...base, sessionId: sessionScope };
        const order = { attempts: 'ASC', createdAt: 'ASC' };
        let rows;
        try {
            rows = await this.repo.find({ where, order, take: REDRIVE_BATCH_SIZE });
        }
        catch (err) {
            this.logger.warn('Reading the dead letters of an instance failed; reading them row by row', {
                pluginId,
                instanceId,
                error: err instanceof Error ? err.message : String(err),
                action: 'ingress_redrive_window_unreadable',
            });
            const ids = await this.repo.find({ select: { id: true }, where, order, take: REDRIVE_BATCH_SIZE });
            rows = [];
            for (const { id } of ids) {
                try {
                    const row = await this.repo.findOneBy({ id });
                    if (row)
                        rows.push(row);
                }
                catch (rowError) {
                    this.logger.error('A dead letter could not be read and is skipped', rowError instanceof Error ? rowError.message : String(rowError), { id, action: 'ingress_redrive_row_unreadable' });
                    await this.repo.increment({ id }, 'attempts', 1).catch(() => undefined);
                }
            }
        }
        let redriven = 0;
        for (const row of rows) {
            if (this.stop.signal.aborted)
                break;
            const stored = (row.payload ?? {});
            const jobId = `redrive:${row.id}`;
            const result = await this.ingressEnqueue
                .enqueue({
                pluginId,
                instanceId,
                route: stored.route ?? '',
                method: stored.method ?? 'POST',
                deliveryId: row.deliveryId ?? row.id,
                sessionId: row.sessionId ?? undefined,
                providerConversationId: stored.providerConversationId,
                payload: stored.ingress,
            }, jobId, this.stop.signal)
                .catch(err => {
                if (this.stop.signal.aborted)
                    return undefined;
                throw err;
            });
            if (!result)
                break;
            const { outcome, error } = result;
            if (outcome !== 'failed') {
                if (row.deliveryId) {
                    await this.events.update({ pluginId, instanceId, providerDeliveryId: row.deliveryId, dispatchState: 'pending' }, { dispatchState: 'dispatched', lastDispatchAt: new Date(), payload: null });
                }
                await this.repo.update({ id: row.id }, { redriven: true });
                redriven++;
            }
            else {
                await this.repo.update({ id: row.id }, { attempts: Math.max(0, row.attempts ?? 0) + 1, lastError: error ?? 'redrive dispatch failed' });
            }
        }
        const remaining = await this.repo.count({ where });
        return { redriven, remaining, batchSize: REDRIVE_BATCH_SIZE };
    }
};
exports.RedriveService = RedriveService;
exports.RedriveService = RedriveService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(integration_delivery_failure_entity_1.IntegrationDeliveryFailure, 'data')),
    __param(1, (0, typeorm_1.InjectRepository)(ingress_event_entity_1.IngressEvent, 'data')),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        ingress_enqueue_service_1.IngressEnqueueService])
], RedriveService);
//# sourceMappingURL=redrive.service.js.map