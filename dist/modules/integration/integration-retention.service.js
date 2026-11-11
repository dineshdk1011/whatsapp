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
exports.IntegrationRetentionService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const ingress_event_entity_1 = require("./entities/ingress-event.entity");
const integration_delivery_failure_entity_1 = require("./entities/integration-delivery-failure.entity");
const ingress_reconciler_service_1 = require("./ingress-reconciler.service");
const logger_service_1 = require("../../common/services/logger.service");
const DEFAULT_DEDUP_RETENTION_DAYS = 7;
const DEFAULT_FAILURE_RETENTION_DAYS = 90;
let IntegrationRetentionService = class IntegrationRetentionService {
    eventRepository;
    failureRepository;
    reconciler;
    logger = (0, logger_service_1.createLogger)('IntegrationRetentionService');
    cleanupTimer;
    constructor(eventRepository, failureRepository, reconciler) {
        this.eventRepository = eventRepository;
        this.failureRepository = failureRepository;
        this.reconciler = reconciler;
    }
    onModuleInit() {
        const parsedRetention = Number.parseInt(process.env.INGRESS_RETENTION_DAYS ?? '', 10);
        const retentionDays = Number.isInteger(parsedRetention)
            ? Math.max(0, parsedRetention)
            : DEFAULT_FAILURE_RETENTION_DAYS;
        const parsedDedup = Number.parseInt(process.env.INGRESS_DEDUP_RETENTION_DAYS ?? '', 10);
        let dedupDays = Number.isInteger(parsedDedup) ? parsedDedup : DEFAULT_DEDUP_RETENTION_DAYS;
        if (dedupDays <= 0) {
            this.logger.warn(`INGRESS_DEDUP_RETENTION_DAYS <= 0 does not disable dedup pruning (an unpruned ingress_events ` +
                `table grows without bound); falling back to the ${DEFAULT_DEDUP_RETENTION_DAYS}-day default`, { action: 'ingress_dedup_retention_clamped' });
            dedupDays = DEFAULT_DEDUP_RETENTION_DAYS;
        }
        if (retentionDays <= 0) {
            this.logger.log('Integration delivery-failure retention disabled (INGRESS_RETENTION_DAYS <= 0); dedup retention still applies');
        }
        const runPrune = () => {
            this.pruneOlderThan(dedupDays, retentionDays > 0 ? retentionDays : null)
                .then(({ events, failures }) => {
                if (events > 0)
                    this.logger.log(`Pruned ${events} ingress event(s) older than ${dedupDays} day(s)`);
                if (failures > 0) {
                    this.logger.log(`Pruned ${failures} integration delivery-failure(s) older than ${retentionDays} day(s)`);
                }
            })
                .catch(err => this.logger.error('Integration ingress retention failed', err instanceof Error ? err.stack : String(err)));
        };
        runPrune();
        this.cleanupTimer = setInterval(runPrune, 24 * 60 * 60 * 1000);
        this.cleanupTimer.unref?.();
    }
    onModuleDestroy() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
        }
    }
    async pruneOlderThan(eventsDays, failuresDays = eventsDays) {
        const eventsCutoff = new Date();
        eventsCutoff.setDate(eventsCutoff.getDate() - eventsDays);
        const failuresCutoff = new Date();
        if (failuresDays !== null)
            failuresCutoff.setDate(failuresCutoff.getDate() - failuresDays);
        const logFailure = (step) => (err) => {
            this.logger.error(`Integration ingress retention: ${step} failed`, err instanceof Error ? err.stack : String(err));
            return { affected: 0 };
        };
        const failuresResult = failuresDays === null
            ? { affected: 0 }
            : await this.failureRepository
                .delete({ createdAt: (0, typeorm_2.LessThan)(failuresCutoff) })
                .catch(logFailure('delivery-failure prune'));
        const aged = (0, typeorm_2.LessThan)(eventsCutoff);
        const eventsResult = await this.eventRepository
            .delete([
            { createdAt: aged, dispatchState: (0, typeorm_2.Not)('pending') },
            { createdAt: aged, dispatchState: (0, typeorm_2.IsNull)() },
            { createdAt: aged, payload: (0, typeorm_2.IsNull)() },
        ])
            .catch(logFailure('dedup prune'));
        await this.reconciler.deadLetterAgedPending(eventsCutoff).catch(logFailure('undispatched event hand-off'));
        return { events: eventsResult.affected || 0, failures: failuresResult.affected || 0 };
    }
};
exports.IntegrationRetentionService = IntegrationRetentionService;
exports.IntegrationRetentionService = IntegrationRetentionService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(ingress_event_entity_1.IngressEvent, 'data')),
    __param(1, (0, typeorm_1.InjectRepository)(integration_delivery_failure_entity_1.IntegrationDeliveryFailure, 'data')),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        ingress_reconciler_service_1.IngressReconcilerService])
], IntegrationRetentionService);
//# sourceMappingURL=integration-retention.service.js.map