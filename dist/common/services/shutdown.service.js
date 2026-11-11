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
exports.ShutdownService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const logger_service_1 = require("./logger.service");
const shutdown_budget_1 = require("./shutdown-budget");
const MAX_SHUTDOWN_DELAY_MS = 30_000;
let ShutdownService = class ShutdownService {
    config;
    logger = (0, logger_service_1.createLogger)('ShutdownService');
    destroyCallback = null;
    shutdownListeners = [];
    shuttingDown = false;
    shutdownScheduled = false;
    tearingDown = false;
    constructor(config) {
        this.config = config;
    }
    setShutdownCallback(callback) {
        this.destroyCallback = callback;
    }
    onShutdown(listener) {
        this.shutdownListeners.push(listener);
    }
    isShuttingDown() {
        return this.shuttingDown;
    }
    isTearingDown() {
        return this.tearingDown;
    }
    markShuttingDown() {
        if (!this.shuttingDown) {
            this.shuttingDown = true;
            this.logger.log('Entering draining state — readiness now reports 503');
            for (const listener of this.shutdownListeners)
                listener();
        }
    }
    shutdown(delayMs) {
        this.markShuttingDown();
        if (this.shutdownScheduled)
            return;
        this.shutdownScheduled = true;
        const delay = Math.min(delayMs ?? this.resolveDelay(), MAX_SHUTDOWN_DELAY_MS);
        this.logger.log('Graceful shutdown requested', { delayMs: delay });
        setTimeout(() => {
            this.logger.log('Initiating shutdown...');
            this.tearingDown = true;
            const budgetMs = (0, shutdown_budget_1.shutdownTeardownLimitMs)(this.config?.get('webhook.shutdownDrainMs') ?? shutdown_budget_1.DEFAULT_WEBHOOK_SHUTDOWN_DRAIN_MS);
            const forceExit = setTimeout(() => {
                this.logger.error('Shutdown teardown exceeded its budget, forcing exit', undefined, { budgetMs });
                process.exit(1);
            }, budgetMs);
            const doShutdown = async () => {
                let exitCode = 0;
                try {
                    if (this.destroyCallback) {
                        await this.destroyCallback();
                    }
                }
                catch (error) {
                    exitCode = 1;
                    this.logger.error('Shutdown teardown failed — exiting non-zero', error instanceof Error ? error.message : String(error));
                }
                finally {
                    clearTimeout(forceExit);
                    process.exit(exitCode);
                }
            };
            void doShutdown();
        }, delay);
    }
    resolveDelay() {
        const parsed = Number.parseInt(process.env.SHUTDOWN_DELAY_MS ?? '', 10);
        if (Number.isInteger(parsed) && parsed >= 0)
            return parsed;
        const env = process.env.NODE_ENV;
        return env === 'development' || env === 'test' ? 0 : shutdown_budget_1.DEFAULT_SHUTDOWN_DELAY_MS;
    }
};
exports.ShutdownService = ShutdownService;
exports.ShutdownService = ShutdownService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ShutdownService);
//# sourceMappingURL=shutdown.service.js.map