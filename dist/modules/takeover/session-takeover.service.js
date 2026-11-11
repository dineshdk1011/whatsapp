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
exports.SessionTakeoverService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const logger_service_1 = require("../../common/services/logger.service");
const feature_flags_1 = require("../../config/feature-flags");
const session_entity_1 = require("../session/entities/session.entity");
const session_ownership_service_1 = require("../session/session-ownership.service");
const shutdown_service_1 = require("../../common/services/shutdown.service");
const session_service_1 = require("../session/session.service");
const session_engine_controls_1 = require("../session/session-engine-controls");
const session_engine_lifecycle_service_1 = require("../session/session-engine-lifecycle.service");
const TAKEOVER_STATUSES = new Set([
    session_entity_1.SessionStatus.READY,
    session_entity_1.SessionStatus.INITIALIZING,
    session_entity_1.SessionStatus.AUTHENTICATING,
    session_entity_1.SessionStatus.ACTION_REQUIRED,
    session_entity_1.SessionStatus.DISCONNECTED,
]);
const TAKEOVER_START_STAGGER_MS = 2000;
const STRANDED_LEASE_TTL_MULTIPLE = 2;
let SessionTakeoverService = class SessionTakeoverService {
    sessionService;
    ownership;
    configService;
    shutdownService;
    logger = (0, logger_service_1.createLogger)('SessionTakeoverService');
    sweepTimer;
    sweepInFlight = false;
    shuttingDown = false;
    constructor(sessionService, ownership, configService, shutdownService) {
        this.sessionService = sessionService;
        this.ownership = ownership;
        this.configService = configService;
        this.shutdownService = shutdownService;
    }
    get stopping() {
        return this.shuttingDown || this.shutdownService?.isShuttingDown() === true;
    }
    onApplicationBootstrap() {
        const sweepMs = this.configService?.get('session.takeoverSweepMs', 30_000) ?? 30_000;
        this.sweepTimer = setInterval(() => {
            if (this.sweepInFlight)
                return;
            this.sweepInFlight = true;
            void this.sweep()
                .catch(error => this.logger.warn('Takeover sweep failed', {
                error: error instanceof Error ? error.message : String(error),
            }))
                .finally(() => {
                this.sweepInFlight = false;
            });
        }, sweepMs);
        this.sweepTimer.unref?.();
    }
    onModuleDestroy() {
        this.shuttingDown = true;
        if (this.sweepTimer) {
            clearInterval(this.sweepTimer);
            this.sweepTimer = undefined;
        }
    }
    async sweep() {
        if (this.stopping)
            return;
        const lapsed = await this.ownership.lapsedHeldByOthers();
        const goneBefore = new Date(Date.now() - this.ownership.leaseTtlMs * STRANDED_LEASE_TTL_MULTIPLE);
        try {
            await this.sessionService.markLapsedDisconnected(lapsed, goneBefore);
        }
        catch (error) {
            this.logger.warn('Lapsed session status correction failed', {
                error: error instanceof Error ? error.message : String(error),
            });
        }
        if (!(0, feature_flags_1.resolveFeatureFlags)(this.configService).autoStartSessions)
            return;
        const eligible = lapsed.filter(session => this.isEligible(session));
        if (eligible.length === 0)
            return;
        for (let i = 0; i < eligible.length; i++) {
            const session = eligible[i];
            if (this.stopping)
                return;
            if (!this.hasStartCapacity()) {
                this.logger.debug('Takeover paused: this node is at MAX_CONCURRENT_SESSIONS', {
                    pending: eligible.length - i,
                });
                return;
            }
            try {
                await this.sessionService.start(session.id);
                this.logger.log(`Adopted session ${session.name} from lapsed node ${session.nodeId ?? '?'}`, {
                    sessionId: session.id,
                    fromNode: session.nodeId,
                    action: 'session_takeover',
                });
            }
            catch (error) {
                if (error instanceof session_engine_controls_1.SessionStoppedException) {
                    this.logger.debug(`Session ${session.name} skipped: stopped by an operator`, { sessionId: session.id });
                }
                else if (error instanceof session_engine_controls_1.ServerShuttingDownException) {
                    this.logger.debug(`Takeover of session ${session.name} abandoned: shutting down`, { sessionId: session.id });
                    return;
                }
                else if (error instanceof common_1.ConflictException) {
                    this.logger.debug(`Session ${session.name} was adopted by another node first`, { sessionId: session.id });
                }
                else {
                    this.logger.warn(`Takeover start failed for session ${session.name}`, {
                        sessionId: session.id,
                        error: error instanceof Error ? error.message : String(error),
                    });
                }
            }
            if (i < eligible.length - 1) {
                await new Promise(resolve => setTimeout(resolve, TAKEOVER_START_STAGGER_MS));
            }
        }
    }
    hasStartCapacity() {
        const max = (0, session_engine_lifecycle_service_1.resolveMaxConcurrentSessions)(this.configService);
        return max === null || this.sessionService.hasStartCapacity(max);
    }
    isEligible(session) {
        return Boolean(session.phone) && TAKEOVER_STATUSES.has(session.status) && !session.desiredState;
    }
};
exports.SessionTakeoverService = SessionTakeoverService;
exports.SessionTakeoverService = SessionTakeoverService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Optional)()),
    __param(3, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [session_service_1.SessionService,
        session_ownership_service_1.SessionOwnershipService,
        config_1.ConfigService,
        shutdown_service_1.ShutdownService])
], SessionTakeoverService);
//# sourceMappingURL=session-takeover.service.js.map