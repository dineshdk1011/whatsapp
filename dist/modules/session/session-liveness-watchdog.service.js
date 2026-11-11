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
exports.SESSION_WATCHDOG_MAX_FAILURES = exports.SESSION_WATCHDOG_PROBE_TIMEOUT_MS = exports.SESSION_WATCHDOG_INTERVAL_MS = exports.SessionLivenessWatchdog = void 0;
const common_1 = require("@nestjs/common");
const engine_registry_service_1 = require("../../engine/engine-registry.service");
const whatsapp_engine_interface_1 = require("../../engine/interfaces/whatsapp-engine.interface");
const logger_service_1 = require("../../common/services/logger.service");
const shutdown_service_1 = require("../../common/services/shutdown.service");
let SessionLivenessWatchdog = class SessionLivenessWatchdog {
    engines;
    shutdownService;
    logger = (0, logger_service_1.createLogger)('SessionLivenessWatchdog');
    failures = new Map();
    timer = null;
    onDead = () => Promise.resolve();
    constructor(engines, shutdownService) {
        this.engines = engines;
        this.shutdownService = shutdownService;
    }
    start(onDead, intervalMs = exports.SESSION_WATCHDOG_INTERVAL_MS) {
        this.onDead = onDead;
        if (this.timer)
            return;
        this.timer = setInterval(() => {
            void this.tick();
        }, intervalMs);
        this.timer.unref();
    }
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.failures.clear();
    }
    clear(id) {
        this.failures.delete(id);
    }
    async tick() {
        if (this.shutdownService?.isShuttingDown()) {
            return;
        }
        await Promise.allSettled([...this.engines].map(([id, engine]) => this.probe(id, engine)));
    }
    async probe(id, engine) {
        const status = engine.getStatus();
        const observeOnly = status === whatsapp_engine_interface_1.EngineStatus.ACTION_REQUIRED;
        if (status !== whatsapp_engine_interface_1.EngineStatus.READY && !observeOnly) {
            this.failures.delete(id);
            return;
        }
        if (typeof engine.probeLiveness !== 'function') {
            return;
        }
        let alive;
        let probeTimer;
        try {
            alive = await Promise.race([
                engine.probeLiveness(),
                new Promise((_, reject) => {
                    probeTimer = setTimeout(() => reject(new Error('liveness probe timed out')), exports.SESSION_WATCHDOG_PROBE_TIMEOUT_MS);
                }),
            ]);
        }
        catch {
            alive = false;
        }
        finally {
            if (probeTimer)
                clearTimeout(probeTimer);
        }
        if (!this.engines.isLive(id, engine)) {
            return;
        }
        if (engine.getStatus() !== status) {
            this.failures.delete(id);
            return;
        }
        if (alive) {
            if (observeOnly && this.failures.has(id)) {
                this.logger.log('Liveness probe answering again while the session awaits operator action', {
                    sessionId: id,
                    action: 'watchdog_probe_recovered',
                });
            }
            this.failures.delete(id);
            return;
        }
        const failures = (this.failures.get(id) ?? 0) + 1;
        if (observeOnly) {
            this.failures.set(id, failures);
            if (failures === 1) {
                this.logger.warn('Liveness probe failed while the session awaits operator action; not reconnecting it — ' +
                    'the status is operator-owned. If the page is gone, stop and start the session.', { sessionId: id, action: 'watchdog_probe_failed_observe_only' });
            }
            return;
        }
        if (failures < exports.SESSION_WATCHDOG_MAX_FAILURES) {
            this.failures.set(id, failures);
            this.logger.warn('Liveness probe failed; will treat the session as dead after repeated failures', {
                sessionId: id,
                failures,
                action: 'watchdog_probe_failed',
            });
            return;
        }
        this.failures.delete(id);
        this.logger.warn('Liveness probe failed repeatedly; handling the session as disconnected', {
            sessionId: id,
            failures,
            action: 'watchdog_disconnect',
        });
        await this.onDead(id, engine, 'liveness probe failed (watchdog)');
    }
};
exports.SessionLivenessWatchdog = SessionLivenessWatchdog;
exports.SessionLivenessWatchdog = SessionLivenessWatchdog = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [engine_registry_service_1.EngineRegistry,
        shutdown_service_1.ShutdownService])
], SessionLivenessWatchdog);
exports.SESSION_WATCHDOG_INTERVAL_MS = 60_000;
exports.SESSION_WATCHDOG_PROBE_TIMEOUT_MS = 15_000;
exports.SESSION_WATCHDOG_MAX_FAILURES = 2;
//# sourceMappingURL=session-liveness-watchdog.service.js.map