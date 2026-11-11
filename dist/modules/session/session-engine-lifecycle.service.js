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
exports.SessionEngineLifecycle = exports.EngineInitTimeoutError = void 0;
exports.resolveReconnectConfig = resolveReconnectConfig;
exports.isReconnectPending = isReconnectPending;
exports.startSlotHolders = startSlotHolders;
exports.resolveMaxConcurrentSessions = resolveMaxConcurrentSessions;
exports.readyRowUpdate = readyRowUpdate;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const session_entity_1 = require("./entities/session.entity");
const engine_factory_1 = require("../../engine/engine.factory");
const engine_registry_service_1 = require("../../engine/engine-registry.service");
const lid_mapping_store_service_1 = require("../../engine/identity/lid-mapping-store.service");
const reconnect_policy_1 = require("./reconnect-policy");
const session_liveness_watchdog_service_1 = require("./session-liveness-watchdog.service");
const message_projector_service_1 = require("./message-projector.service");
const session_error_store_service_1 = require("./session-error-store.service");
const session_restriction_store_service_1 = require("./session-restriction-store.service");
const presence_store_service_1 = require("./presence-store.service");
const audit_service_1 = require("../audit/audit.service");
const audit_log_entity_1 = require("../audit/entities/audit-log.entity");
const engine_init_timeout_1 = require("../../engine/engine-init-timeout");
const terminal_engine_failure_1 = require("../../engine/terminal-engine-failure");
const status_store_service_1 = require("../status-store/status-store.service");
const logger_service_1 = require("../../common/services/logger.service");
const shutdown_service_1 = require("../../common/services/shutdown.service");
const session_reconnect_metrics_1 = require("../../common/metrics/session-reconnect-metrics");
const events_gateway_1 = require("../events/events.gateway");
const webhook_service_1 = require("../webhook/webhook.service");
const hooks_1 = require("../../core/hooks");
const session_lifecycle_fences_1 = require("./session-lifecycle-fences");
const session_status_broadcaster_1 = require("./session-status-broadcaster");
const session_engine_leaf_events_1 = require("./session-engine-leaf-events");
const session_engine_event_wiring_1 = require("./session-engine-event-wiring");
const session_engine_controls_1 = require("./session-engine-controls");
const session_ownership_service_1 = require("./session-ownership.service");
const isStatusSeedOnReadyEnabled = () => process.env.STATUS_SEED_ON_READY === 'true';
const RECONNECT_BASE_DELAY_MIN_MS = 1000;
const RECONNECT_BASE_DELAY_MAX_MS = 300_000;
const RECONNECT_MAX_ATTEMPTS_CAP = 20;
function resolveReconnectConfig(config) {
    const toNumber = (v) => (v == null || (typeof v === 'string' && v.trim() === '') ? NaN : Number(v));
    const baseRaw = toNumber(config?.reconnectBaseDelay);
    const baseDelay = Math.floor((0, reconnect_policy_1.clampNumber)(Number.isFinite(baseRaw) ? baseRaw : 5000, RECONNECT_BASE_DELAY_MIN_MS, RECONNECT_BASE_DELAY_MAX_MS));
    const attemptsRaw = toNumber(config?.maxReconnectAttempts);
    const maxAttempts = Number.isFinite(attemptsRaw)
        ? Math.floor((0, reconnect_policy_1.clampNumber)(attemptsRaw, 0, RECONNECT_MAX_ATTEMPTS_CAP))
        : Number.POSITIVE_INFINITY;
    return { maxAttempts, baseDelay };
}
function isReconnectPending(state) {
    return state.timer !== null || (state.attempts > 0 && state.readyAt === undefined);
}
function startSlotHolders(engines, reconnectStates) {
    const ids = new Set(engines.activeIds());
    for (const [rid, state] of reconnectStates)
        if (isReconnectPending(state))
            ids.add(rid);
    return ids;
}
function resolveMaxConcurrentSessions(configService) {
    const configured = configService?.get('sessions.maxConcurrent', 0) ?? 0;
    if (!Number.isFinite(configured) || configured <= 0)
        return null;
    return Math.floor(configured);
}
class EngineInitTimeoutError extends Error {
    timeoutMs;
    constructor(timeoutMs) {
        super(`engine.initialize() timed out after ${timeoutMs}ms`);
        this.timeoutMs = timeoutMs;
        this.name = 'EngineInitTimeoutError';
    }
}
exports.EngineInitTimeoutError = EngineInitTimeoutError;
const ENGINE_AUTH_TIMEOUT = 'auth timeout';
const ENGINE_AUTH_TIMEOUT_MESSAGE = 'WhatsApp Web authentication timed out. Verify the session proxy URL and network egress can reach ' +
    'WhatsApp; for slow first boots, raise WWEBJS_AUTH_TIMEOUT_MS.';
function isAuthTimeoutRejection(err) {
    return err === ENGINE_AUTH_TIMEOUT || (err instanceof Error && err.message === ENGINE_AUTH_TIMEOUT);
}
const TERMINAL_UNLINK_REASONS = new Set(['LOGOUT', 'UNPAIRED', 'UNPAIRED_IDLE', 'logged out']);
function readyRowUpdate(phone, pushName, at) {
    return {
        status: session_entity_1.SessionStatus.READY,
        ...(phone ? { phone } : {}),
        pushName,
        connectedAt: at,
        lastActiveAt: at,
    };
}
let SessionEngineLifecycle = class SessionEngineLifecycle {
    sessionRepository;
    dataSource;
    engineFactory;
    engineRegistry;
    watchdog;
    messages;
    sessionErrors;
    sessionRestrictions;
    presence;
    eventsGateway;
    webhookService;
    hookManager;
    statusStore;
    configService;
    shutdownService;
    auditService;
    ownership;
    logger = (0, logger_service_1.createLogger)('SessionEngineLifecycle');
    get engines() {
        return this.engineRegistry;
    }
    fences;
    broadcaster;
    leafEvents;
    eventWiring;
    wiringHost;
    controls;
    closed = false;
    reconnectStates = new Map();
    get lastDispatchedStatus() {
        return this.broadcaster.lastDispatchedStatus;
    }
    stoppingSessions = new session_engine_controls_1.StopMarks();
    get initializingSessions() {
        return this.engineRegistry.initializing;
    }
    pendingTeardowns = new Map();
    pendingInitialStatuses = new Map();
    operatorTeardowns = new Map();
    stuckAuthRecoveryUsed = new Set();
    constructor(sessionRepository, dataSource, engineFactory, engineRegistry, watchdog, messages, sessionErrors, sessionRestrictions, presence, eventsGateway, webhookService, hookManager, statusStore, configService, shutdownService, auditService, ownership, lidMappingStore) {
        this.sessionRepository = sessionRepository;
        this.dataSource = dataSource;
        this.engineFactory = engineFactory;
        this.engineRegistry = engineRegistry;
        this.watchdog = watchdog;
        this.messages = messages;
        this.sessionErrors = sessionErrors;
        this.sessionRestrictions = sessionRestrictions;
        this.presence = presence;
        this.eventsGateway = eventsGateway;
        this.webhookService = webhookService;
        this.hookManager = hookManager;
        this.statusStore = statusStore;
        this.configService = configService;
        this.shutdownService = shutdownService;
        this.auditService = auditService;
        this.ownership = ownership;
        lidMappingStore?.onSecondLid(({ phone, previousLid, newLid, sessionId }) => {
            void this.auditService?.logWarn(audit_log_entity_1.AuditAction.PHONE_SECOND_LID_REPORTED, {
                sessionId: sessionId ?? undefined,
                metadata: { phone, previousLid, newLid },
                errorMessage: `Phone ${phone} was reported under privacy id ${newLid} while ${previousLid} still maps to it. ` +
                    'Review the API keys whose allowed chats name either id or this number.',
            });
        });
        this.fences = new session_lifecycle_fences_1.SessionLifecycleFences({
            engines: this.engineRegistry,
            pendingTeardowns: this.pendingTeardowns,
            pendingInitialStatuses: this.pendingInitialStatuses,
            logger: this.logger,
        });
        this.broadcaster = new session_status_broadcaster_1.SessionStatusBroadcaster({
            sessionRepository: this.sessionRepository,
            eventsGateway: this.eventsGateway,
            webhookService: this.webhookService,
            logger: this.logger,
        });
        this.leafEvents = new session_engine_leaf_events_1.SessionEngineLeafEvents({
            sessionRepository: this.sessionRepository,
            eventsGateway: this.eventsGateway,
            webhookService: this.webhookService,
            configService: this.configService,
            statusStore: this.statusStore,
            logger: this.logger,
        });
        this.eventWiring = new session_engine_event_wiring_1.SessionEngineEventWiring({ logger: this.logger });
        this.wiringHost = {
            isLiveEngine: (id, engine) => this.isLiveEngine(id, engine),
            isOperatorTeardown: (id, engine) => this.operatorTeardowns.get(id) === engine,
            ownsSession: id => this.ownsSession(id),
            handleEngineReady: (id, engine, phone, pushName) => this.handleEngineReady(id, engine, phone, pushName),
            handleEnginePushName: (id, engine, pushName) => this.handleEnginePushName(id, engine, pushName),
            rejectRebind: (id, engine, sessionName, previousPhone, incomingPhone) => this.rejectRebind(id, engine, sessionName, previousPhone, incomingPhone),
            handleEngineDisconnected: (id, engine, reason) => this.handleEngineDisconnected(id, engine, reason),
            updateStatus: (id, status) => this.updateStatus(id, status),
            cancelReconnect: id => this.cancelReconnect(id),
            endReadyStretch: id => this.endReadyStretch(id),
            parkReconnectInitFailure: (id, run, reason) => this.parkReconnectInitFailure(id, run, reason),
            evictAndForceDestroy: (id, engine) => this.evictAndForceDestroy(id, engine),
            trackPendingCredentialTeardown: (sessionName, raw) => this.trackPendingCredentialTeardown(sessionName, raw),
            reportRestrictionLifted: (id, lifted) => this.reportRestrictionLifted(id, lifted),
            claimStuckAuthRecovery: (id, engine) => {
                if (!this.isLiveEngine(id, engine))
                    return false;
                if (this.stuckAuthRecoveryUsed.has(id))
                    return false;
                this.stuckAuthRecoveryUsed.add(id);
                return true;
            },
            messages: this.messages,
            sessionErrors: this.sessionErrors,
            sessionRestrictions: this.sessionRestrictions,
            presence: this.presence,
            auditService: this.auditService,
            webhookService: this.webhookService,
            eventsGateway: this.eventsGateway,
            hookManager: this.hookManager,
            leafEvents: this.leafEvents,
        };
        this.controls = new session_engine_controls_1.SessionEngineControls({
            ownsSession: (id) => this.ownsSession(id),
            isClosed: () => this.closed,
            sessionRepository: this.sessionRepository,
            engineFactory: this.engineFactory,
            engines: this.engineRegistry,
            sessionErrors: this.sessionErrors,
            sessionRestrictions: this.sessionRestrictions,
            presence: this.presence,
            hookManager: this.hookManager,
            configService: this.configService,
            logger: this.logger,
            dataSource: () => this.dataSource,
            fences: this.fences,
            broadcaster: this.broadcaster,
            cancelReconnect: id => this.cancelReconnect(id),
            initializeEngine: (id, session) => this.initializeEngine(id, session),
            isSessionRetired: id => this.isSessionRetired(id),
            nodeId: this.ownership?.nodeId,
            prepareStart: (id, desiredState) => this.prepareStart(id, desiredState),
            purgeAuthDirsIfDeleted: id => this.purgeAuthDirsIfDeleted(id),
            updateStatus: (id, status) => this.updateStatus(id, status),
            stoppingSessions: this.stoppingSessions,
            operatorTeardowns: this.operatorTeardowns,
            reconnectStates: this.reconnectStates,
            stuckAuthRecoveryUsed: this.stuckAuthRecoveryUsed,
            initializingSessions: this.initializingSessions,
        });
    }
    start(id, options) {
        return this.controls.start(id, options);
    }
    stop(id, hooks) {
        return this.controls.stop(id, hooks);
    }
    logout(id, hooks) {
        return this.controls.logout(id, hooks);
    }
    forceKill(id, hooks) {
        return this.controls.forceKill(id, hooks);
    }
    delete(id, hooks) {
        return this.controls.delete(id, hooks);
    }
    holdDelete(id) {
        return this.controls.holdDelete(id);
    }
    shutdown() {
        this.closed = true;
        return this.controls.shutdown();
    }
    stopOrphanEngines(sessionIds) {
        return this.controls.stopOrphanEngines(sessionIds);
    }
    teardownEngineSafely(sessionId, engine, teardown, label, sessionName) {
        return this.fences.teardownEngineSafely(sessionId, engine, teardown, label, sessionName);
    }
    trackPendingCredentialTeardown(sessionName, raw) {
        this.fences.trackPendingCredentialTeardown(sessionName, raw);
    }
    awaitPendingTeardown(sessionName) {
        return this.fences.awaitPendingTeardown(sessionName);
    }
    evictAndForceDestroy(id, engine) {
        this.fences.evictAndForceDestroy(id, engine);
    }
    markStopping(id) {
        this.stoppingSessions.add(id);
    }
    clearStopping(id) {
        this.stoppingSessions.delete(id);
    }
    isEngineActive(id) {
        if (this.engines.has(id) || this.initializingSessions.has(id) || this.controls.isDeleting(id))
            return true;
        const reconnect = this.reconnectStates.get(id);
        return reconnect != null && isReconnectPending(reconnect);
    }
    startSlotHolders() {
        return startSlotHolders(this.engines, this.reconnectStates);
    }
    readyStretchHeld(state) {
        return state.readyAt !== undefined && (state.readyEndedAt ?? Date.now()) - state.readyAt >= reconnect_policy_1.STABLE_READY_MS;
    }
    endReadyStretch(id) {
        const state = this.reconnectStates.get(id);
        if (state?.readyAt !== undefined && state.readyEndedAt === undefined)
            state.readyEndedAt = Date.now();
    }
    seedStatuses(sessionId, engine) {
        return this.leafEvents.seedStatuses(sessionId, engine);
    }
    isLiveEngine(id, engine) {
        return this.engines.isLive(id, engine);
    }
    ownsSession(id) {
        return (0, session_ownership_service_1.nodeOwnsSession)(this.ownership, id);
    }
    async initializeEngine(id, session) {
        if (this.stoppingSessions.has(id))
            return;
        if (this.closed) {
            throw new session_engine_controls_1.ServerShuttingDownException();
        }
        this.logger.log(`Initializing engine for session: ${session.name}`, {
            sessionId: id,
            action: 'engine_init',
            proxyEnabled: !!session.proxyUrl,
        });
        const engine = this.engineFactory.create({
            sessionId: id,
            dbSessionId: id,
            proxyUrl: session.proxyUrl || undefined,
            proxyType: session.proxyType || undefined,
        });
        this.engines.set(id, engine, session.proxyUrl || undefined);
        this.presence.clear(id);
        this.sessionErrors.clear(id);
        const initialStatusPromise = this.updateStatus(id, session_entity_1.SessionStatus.INITIALIZING, () => !this.closed && this.isLiveEngine(id, engine) && !this.stoppingSessions.has(id));
        this.pendingInitialStatuses.set(id, { engine, promise: initialStatusPromise });
        try {
            await initialStatusPromise;
        }
        finally {
            const pending = this.pendingInitialStatuses.get(id);
            if (pending && pending.engine === engine && pending.promise === initialStatusPromise) {
                this.pendingInitialStatuses.delete(id);
            }
        }
        if (this.closed || !this.isLiveEngine(id, engine)) {
            return;
        }
        if (this.stoppingSessions.has(id)) {
            return;
        }
        const initPromise = engine.initialize(this.eventWiring.buildCallbacks(id, engine, session.name, this.wiringHost, session.phone ?? null));
        const engineInitTimeoutMs = (0, engine_init_timeout_1.resolveEngineInitTimeoutMs)();
        initPromise.catch(() => undefined);
        let initTimer;
        try {
            await Promise.race([
                initPromise,
                new Promise((_, reject) => {
                    initTimer = setTimeout(() => reject(new EngineInitTimeoutError(engineInitTimeoutMs)), engineInitTimeoutMs);
                }),
            ]);
        }
        catch (err) {
            if (err instanceof EngineInitTimeoutError) {
                this.logger.error(`Engine initialization timed out for session ${session.name}`, undefined, {
                    sessionId: id,
                    action: 'engine_init_timeout',
                });
                const wasLive = this.engines.deleteIfLive(id, engine);
                const reconnectState = this.reconnectStates.get(id);
                const reconnectAttempt = reconnectState?.started;
                const isCurrentTimeout = () => wasLive &&
                    !this.engines.has(id) &&
                    this.reconnectStates.get(id) === reconnectState &&
                    reconnectState?.started === reconnectAttempt;
                if (wasLive)
                    this.sessionErrors.set(id, err.message);
                await this.teardownEngineSafely(id, engine, e => e.forceDestroy(), 'force-destroy');
                if (isCurrentTimeout()) {
                    const nodeId = this.ownership?.nodeId;
                    const ours = nodeId === undefined
                        ? id
                        : [
                            { id, nodeId },
                            { id, nodeId: (0, typeorm_2.IsNull)() },
                        ];
                    const { affected } = await this.sessionRepository.update(ours, { status: session_entity_1.SessionStatus.DISCONNECTED });
                    if (affected !== 0 && isCurrentTimeout())
                        this.broadcaster.announce(id, session_entity_1.SessionStatus.DISCONNECTED);
                }
                throw new common_1.HttpException(`Engine initialization timed out after ${err.timeoutMs}ms: the engine did not finish starting. ` +
                    'WhatsApp Web, the network or the session proxy may be unreachable, or the browser may have ' +
                    'stalled during startup (for example a container memory/resource limit). Retry the session; for ' +
                    'chronically slow first boots, raise WWEBJS_AUTH_TIMEOUT_MS.', common_1.HttpStatus.GATEWAY_TIMEOUT);
            }
            else if (isAuthTimeoutRejection(err)) {
                throw new common_1.HttpException(ENGINE_AUTH_TIMEOUT_MESSAGE, common_1.HttpStatus.GATEWAY_TIMEOUT);
            }
            throw err;
        }
        finally {
            if (initTimer)
                clearTimeout(initTimer);
        }
    }
    async rejectRebind(id, engine, sessionName, previousPhone, incomingPhone) {
        if (!this.isLiveEngine(id, engine))
            return;
        const reason = `Link rejected: this session is bound to ${previousPhone}, but a different WhatsApp number ` +
            `(${incomingPhone}) scanned its QR. Re-pair the original number, or delete the session to bind a new one.`;
        this.logger.warn('Rejected a QR link from a different WhatsApp account', {
            sessionId: id,
            previousPhone,
            incomingPhone,
            action: 'rebind_rejected',
        });
        this.stoppingSessions.add(id);
        this.cancelReconnect(id);
        this.watchdog.clear(id);
        this.sessionErrors.set(id, reason);
        void this.auditService?.logWarn(audit_log_entity_1.AuditAction.SESSION_REBIND_REJECTED, {
            sessionId: id,
            metadata: { previousPhone, incomingPhone },
            errorMessage: reason,
        });
        this.engines.deleteIfLive(id, engine);
        await this.teardownEngineSafely(id, engine, e => e.logout(), 'logout', sessionName);
        if (this.engines.has(id))
            return;
        if (this.ownsSession(id)) {
            await this.updateStatus(id, session_entity_1.SessionStatus.FAILED).catch(err => this.logger.warn('Failed to persist the rebind-rejected FAILED state', {
                sessionId: id,
                error: err instanceof Error ? err.message : String(err),
            }));
        }
    }
    handleEngineReady(id, engine, phone, pushName) {
        if (!this.isLiveEngine(id, engine))
            return;
        this.logger.log('Session ready', {
            sessionId: id,
            phone,
            pushName,
            action: 'ready',
        });
        void this.webhookService.dispatch(id, 'session.authenticated', { sessionId: id, phone, pushName });
        this.eventsGateway.emitSessionAuthenticated(id, { phone, pushName });
        void this.hookManager.execute('session:ready', { phone, pushName }, {
            sessionId: id,
            source: 'Engine',
        });
        const reconnectState = this.reconnectStates.get(id);
        if (reconnectState) {
            if (this.readyStretchHeld(reconnectState))
                reconnectState.attempts = 0;
            reconnectState.readyAt = Date.now();
            reconnectState.readyEndedAt = undefined;
            reconnectState.readRetry = undefined;
            if (reconnectState.timer) {
                clearTimeout(reconnectState.timer);
                reconnectState.timer = null;
            }
        }
        this.watchdog.clear(id);
        this.sessionErrors.clear(id);
        const liftedByReady = this.sessionRestrictions.clearIfDisprovedByReady(id);
        if (liftedByReady) {
            this.reportRestrictionLifted(id, liftedByReady);
        }
        this.stuckAuthRecoveryUsed.delete(id);
        void this.sessionRepository.update(id, readyRowUpdate(phone, pushName, new Date())).catch(err => this.logger.warn('Failed to persist session ready state', {
            sessionId: id,
            error: err instanceof Error ? err.message : String(err),
        }));
        this.reapplyOwnPresence(id);
        if (isStatusSeedOnReadyEnabled()) {
            void this.seedStatuses(id, engine);
        }
        else {
            this.logger.debug('Status backfill on session ready is disabled', {
                sessionId: id,
                action: 'status_seed_on_ready_disabled',
            });
        }
    }
    handleEnginePushName(id, engine, pushName) {
        if (!pushName || !this.isLiveEngine(id, engine) || !this.ownsSession(id))
            return;
        void this.sessionRepository.update(id, { pushName }).catch(err => this.logger.warn('Failed to store the synced push name', {
            sessionId: id,
            error: String(err),
            action: 'push_name_store_failed',
        }));
    }
    reapplyOwnPresence(id) {
        const desired = this.presence.getOwnIntent(id);
        if (desired === undefined)
            return;
        const engine = this.engines.get(id);
        if (!engine)
            return;
        void engine.setOnlinePresence(desired).catch(error => {
            this.logger.warn(`Could not re-apply own presence for session ${id} (best-effort)`, {
                sessionId: id,
                error: error instanceof Error ? error.message : String(error),
                action: 'own_presence_reapply_failed',
            });
        });
    }
    reportRestrictionLifted(id, lifted) {
        this.logger.log(`The ${lifted.kind} restriction on this session is no longer in force`, {
            sessionId: id,
            kind: lifted.kind,
            code: lifted.code,
            action: 'account_restriction_lifted',
        });
        void this.webhookService.dispatch(id, 'session.restriction', {
            sessionId: id,
            active: false,
            kind: lifted.kind,
            code: lifted.code,
            expiresAt: null,
        });
        this.eventsGateway.emitSessionRestriction(id, {
            active: false,
            kind: lifted.kind,
            code: lifted.code,
            expiresAt: null,
        });
        void this.auditService?.logInfo(audit_log_entity_1.AuditAction.SESSION_RESTRICTION_LIFTED, {
            sessionId: id,
            metadata: { kind: lifted.kind, code: lifted.code },
        });
    }
    async handleEngineDisconnected(id, engine, reason) {
        if (!this.isLiveEngine(id, engine))
            return;
        let session;
        try {
            session = await this.sessionRepository.findOne({ where: { id } });
        }
        catch (err) {
            this.logger.error('Failed to reload the session for reconnect scheduling', String(err), {
                sessionId: id,
                action: 'reconnect_schedule_error',
            });
            this.retryDisconnectAfterFailedRead(id, engine, reason);
            return;
        }
        if (!session)
            return;
        if (!this.isLiveEngine(id, engine))
            return;
        const pending = this.endReadRetry(id);
        if (pending && TERMINAL_UNLINK_REASONS.has(pending) && !TERMINAL_UNLINK_REASONS.has(reason))
            reason = pending;
        this.logger.warn(`Session disconnected: ${reason}`, {
            sessionId: id,
            reason,
            action: 'disconnected',
        });
        if (TERMINAL_UNLINK_REASONS.has(reason) && this.recordTerminalUnlink(id, reason)) {
            session = { ...session, phone: null };
        }
        this.announceDisconnected(id, reason);
        void this.updateStatus(id, session_entity_1.SessionStatus.DISCONNECTED).catch(err => this.logger.warn('Failed to persist the disconnected status', {
            sessionId: id,
            error: err instanceof Error ? err.message : String(err),
        }));
        if (!this.isLiveEngine(id, engine))
            return;
        this.scheduleReconnect(id, session);
    }
    retryDisconnectAfterFailedRead(id, engine, reason) {
        const state = this.reconnectStates.get(id);
        if (!state || this.closed || this.shutdownService?.isShuttingDown())
            return;
        if (!this.isLiveEngine(id, engine))
            return;
        if (state.timer) {
            if (!TERMINAL_UNLINK_REASONS.has(reason))
                return;
            if (state.readRetry?.timer === state.timer)
                state.readRetry.reason = reason;
            else
                this.reportUnlinkWithoutRow(id, reason);
            return;
        }
        const attempts = (state.readRetry?.attempts ?? 0) + 1;
        const delay = Math.min(state.baseDelay * 2 ** (attempts - 1), RECONNECT_BASE_DELAY_MAX_MS);
        const timer = setTimeout(() => {
            state.timer = null;
            void this.handleEngineDisconnected(id, engine, retry.reason);
        }, delay);
        const retry = { timer, attempts, reason };
        state.timer = timer;
        state.readRetry = retry;
    }
    recordTerminalUnlink(id, reason) {
        void this.auditService?.logWarn(audit_log_entity_1.AuditAction.SESSION_DISCONNECTED, {
            sessionId: id,
            metadata: { reason },
            errorMessage: `WhatsApp unlinked this device (${reason}); the session must be re-paired with a fresh QR`,
        });
        if (!this.ownsSession(id))
            return false;
        void this.sessionRepository.update(id, { phone: null }).catch((err) => this.logger.warn('Failed to clear phone after a terminal unlink', {
            sessionId: id,
            error: String(err),
            action: 'unlink_phone_clear_failed',
        }));
        const armed = this.reconnectStates.get(id);
        if (armed?.timer && armed.session)
            armed.session = { ...armed.session, phone: null };
        return true;
    }
    announceDisconnected(id, reason) {
        void this.webhookService.dispatch(id, 'session.disconnected', { sessionId: id, reason });
        this.eventsGateway.emitSessionDisconnected(id, { reason });
        void this.hookManager.execute('session:disconnected', { reason }, { sessionId: id, source: 'Engine' });
    }
    reportUnlinkWithoutRow(id, reason) {
        const cleared = this.recordTerminalUnlink(id, reason);
        this.announceDisconnected(id, reason);
        return cleared;
    }
    endReadRetry(id) {
        const state = this.reconnectStates.get(id);
        const retry = state?.readRetry;
        if (!state || !retry)
            return undefined;
        state.readRetry = undefined;
        if (state.timer !== retry.timer)
            return undefined;
        clearTimeout(retry.timer);
        state.timer = null;
        return retry.reason;
    }
    endReadRetryOfGoneEngine(id) {
        const reason = this.reconnectStates.get(id)?.readRetry?.reason;
        this.endReadRetry(id);
        return reason !== undefined && TERMINAL_UNLINK_REASONS.has(reason) && this.reportUnlinkWithoutRow(id, reason);
    }
    scheduleReconnect(id, session) {
        if (this.shutdownService?.isShuttingDown()) {
            this.logger.log(`Skipping reconnect during shutdown for session: ${session.name}`, { sessionId: id });
            return;
        }
        const state = this.reconnectStates.get(id);
        if (!state)
            return;
        if (state.timer)
            return;
        if (state.readyAt !== undefined) {
            if (this.readyStretchHeld(state))
                state.attempts = 0;
            state.readyAt = undefined;
            state.readyEndedAt = undefined;
        }
        const decision = (0, reconnect_policy_1.decideReconnect)(state);
        if (decision.kind === 'exhausted') {
            this.logger.error(`Max reconnect attempts reached for session: ${session.name}`, undefined, {
                sessionId: id,
                attempts: state.attempts,
                action: 'reconnect_failed',
            });
            const lastError = this.sessionErrors.get(id);
            const reason = lastError && !lastError.startsWith(session_engine_event_wiring_1.RECONNECT_LOOP_REASON)
                ? `${decision.reason} Last error: ${lastError}`
                : decision.reason;
            this.sessionErrors.set(id, reason);
            if (this.ownsSession(id)) {
                void this.updateStatus(id, session_entity_1.SessionStatus.FAILED).catch(err => this.logger.warn('Failed to persist the reconnect-exhausted FAILED state', {
                    sessionId: id,
                    error: err instanceof Error ? err.message : String(err),
                }));
            }
            void this.hookManager.execute('session:error', { reason }, { sessionId: id, source: 'SessionService' });
            const deadEngine = this.engines.get(id);
            if (deadEngine) {
                this.evictAndForceDestroy(id, deadEngine);
            }
            this.cancelReconnect(id);
            return;
        }
        const delay = decision.delayMs;
        const maxAttemptsLabel = Number.isFinite(state.maxAttempts) ? String(state.maxAttempts) : '∞';
        this.logger.log(`Scheduling reconnect attempt ${decision.attempt}/${maxAttemptsLabel} in ${Math.round(delay / 1000)}s`, {
            sessionId: id,
            attempt: decision.attempt,
            delayMs: delay,
            action: 'reconnect_scheduled',
        });
        (0, session_reconnect_metrics_1.incrementSessionReconnectAttempts)();
        if (decision.loopAlert) {
            this.logger.warn(`Session is reconnect-looping: attempt ${decision.attempt} scheduled`, {
                sessionId: id,
                attempts: decision.attempt,
                nextDelayMs: delay,
                action: 'reconnect_loop',
            });
            (0, session_reconnect_metrics_1.incrementSessionReconnectLoopAlerts)();
            void this.webhookService.dispatch(id, 'session.reconnect_loop', {
                sessionId: id,
                attempts: decision.attempt,
                nextDelayMs: delay,
            });
        }
        state.session = session;
        state.timer = setTimeout(() => {
            state.timer = null;
            void this.executeReconnect(id, state.session ?? session, state);
        }, delay);
    }
    prepareStart(id, desiredState) {
        if (this.ownership)
            return this.ownership.prepareStart(id, desiredState);
        return this.sessionRepository
            .update({ id, desiredState: desiredState ?? (0, typeorm_2.IsNull)() }, { desiredState: null })
            .then(({ affected }) => affected !== 0);
    }
    async isSessionRetired(id) {
        if (this.stoppingSessions.has(id)) {
            return true;
        }
        const session = await this.sessionRepository.findOne({ where: { id } });
        return (session == null ||
            !!session.desiredState ||
            !!(this.ownership &&
                (session.nodeId !== this.ownership.nodeId ||
                    session.leaseExpiresAt == null ||
                    session.leaseExpiresAt <= new Date())));
    }
    async purgeAuthDirsIfDeleted(id) {
        try {
            if ((await this.sessionRepository.findOne({ where: { id } })) != null)
                return;
            await this.engineFactory.purgeSessionData(id);
        }
        catch (error) {
            this.logger.warn('Failed to re-purge session auth dirs after a start/delete race', {
                sessionId: id,
                action: 'engine_repurge_failed',
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    async executeReconnect(id, session, state) {
        if (this.stoppingSessions.has(id)) {
            if (this.reconnectStates.get(id) === state)
                this.cancelReconnect(id);
            return;
        }
        let mine;
        const attempt = (state.started = (state.started ?? 0) + 1);
        try {
            const oldEngine = this.engines.get(id);
            if (oldEngine) {
                await this.fences.destroyWithEscalation(id, oldEngine);
                this.engines.deleteIfLive(id, oldEngine);
                if (this.reconnectStates.get(id) === state && state.started === attempt && this.endReadRetryOfGoneEngine(id)) {
                    session = { ...session, phone: null };
                }
            }
            await this.awaitPendingTeardown(session.name);
            if (this.reconnectStates.get(id) !== state || this.stoppingSessions.has(id)) {
                if (this.reconnectStates.get(id) === state)
                    this.cancelReconnect(id);
                return;
            }
            if (state.started !== attempt)
                return;
            if (state.session && state.session.phone == null && session.phone)
                session = { ...session, phone: null };
            state.initInFlight = true;
            try {
                const before = this.engines.get(id);
                const init = this.initializeEngine(id, session);
                const registered = this.engines.get(id);
                mine = registered !== before ? registered : undefined;
                await init;
            }
            finally {
                if (state.started === attempt)
                    state.initInFlight = false;
            }
            if (this.reconnectStates.get(id) !== state || state.started !== attempt) {
                await this.purgeAuthDirsIfDeleted(id);
                return;
            }
            const parked = state.parkedFailure;
            state.parkedFailure = undefined;
            if (parked && this.reconnectStates.get(id) === state)
                parked.run();
            let retired;
            try {
                retired = await this.isSessionRetired(id);
            }
            catch {
                retired = false;
            }
            if (retired) {
                if (mine)
                    await this.controls.retireLaunchedEngine(id, mine);
                if (!this.engines.has(id) && this.reconnectStates.get(id) === state && state.started === attempt) {
                    this.cancelReconnect(id);
                }
                await this.purgeAuthDirsIfDeleted(id);
                return;
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Reconnect attempt ${state.attempts} failed`, errorMessage, {
                sessionId: id,
                action: 'reconnect_error',
            });
            if (this.reconnectStates.get(id) !== state || state.started !== attempt) {
                await this.purgeAuthDirsIfDeleted(id);
                return;
            }
            const parked = state.parkedFailure;
            state.parkedFailure = undefined;
            if (parked && (parked.terminal || (0, terminal_engine_failure_1.isKnownTerminalEngineFailure)(errorMessage))) {
                parked.run();
                return;
            }
            if (mine && this.engines.isLive(id, mine))
                this.evictAndForceDestroy(id, mine);
            if (this.engines.has(id) || state.started !== attempt)
                return;
            if (this.stoppingSessions.has(id)) {
                this.cancelReconnect(id);
                return;
            }
            if (this.endReadRetryOfGoneEngine(id))
                session = { ...session, phone: null };
            this.scheduleReconnect(id, session);
        }
    }
    parkReconnectInitFailure(id, run, reason) {
        const state = this.reconnectStates.get(id);
        if (!state?.initInFlight)
            return false;
        const terminal = reason !== undefined && (0, terminal_engine_failure_1.isKnownTerminalEngineFailure)(reason);
        if (!state.parkedFailure || (reason !== undefined && !state.parkedFailure.terminal)) {
            state.parkedFailure = { run, terminal };
        }
        return true;
    }
    cancelReconnect(id) {
        const state = this.reconnectStates.get(id);
        if (state?.timer) {
            clearTimeout(state.timer);
            state.timer = null;
        }
        this.reconnectStates.delete(id);
    }
    updateStatus(id, status, canAnnounce) {
        return this.broadcaster.updateStatus(id, status, canAnnounce);
    }
    announceStatus(id, status) {
        this.broadcaster.clear(id);
        this.broadcaster.announce(id, status);
    }
};
exports.SessionEngineLifecycle = SessionEngineLifecycle;
exports.SessionEngineLifecycle = SessionEngineLifecycle = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(session_entity_1.Session, 'data')),
    __param(1, (0, typeorm_1.InjectDataSource)('data')),
    __param(13, (0, common_1.Optional)()),
    __param(14, (0, common_1.Optional)()),
    __param(15, (0, common_1.Optional)()),
    __param(16, (0, common_1.Optional)()),
    __param(17, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.DataSource,
        engine_factory_1.EngineFactory,
        engine_registry_service_1.EngineRegistry,
        session_liveness_watchdog_service_1.SessionLivenessWatchdog,
        message_projector_service_1.MessageProjector,
        session_error_store_service_1.SessionErrorStore,
        session_restriction_store_service_1.SessionRestrictionStore,
        presence_store_service_1.PresenceStore,
        events_gateway_1.EventsGateway,
        webhook_service_1.WebhookService,
        hooks_1.HookManager,
        status_store_service_1.StatusStoreService,
        config_1.ConfigService,
        shutdown_service_1.ShutdownService,
        audit_service_1.AuditService,
        session_ownership_service_1.SessionOwnershipService,
        lid_mapping_store_service_1.LidMappingStoreService])
], SessionEngineLifecycle);
//# sourceMappingURL=session-engine-lifecycle.service.js.map