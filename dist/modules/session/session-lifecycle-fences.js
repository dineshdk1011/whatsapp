"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionLifecycleFences = exports.ENGINE_TEARDOWN_TIMEOUT_MS = void 0;
const common_1 = require("@nestjs/common");
exports.ENGINE_TEARDOWN_TIMEOUT_MS = 10_000;
class SessionLifecycleFences {
    engines;
    pendingTeardowns;
    pendingInitialStatuses;
    logger;
    constructor(deps) {
        this.engines = deps.engines;
        this.pendingTeardowns = deps.pendingTeardowns;
        this.pendingInitialStatuses = deps.pendingInitialStatuses;
        this.logger = deps.logger;
    }
    async destroyEngineSafely(sessionId, engine) {
        this.logger.log(`Destroying engine for session ${sessionId}`, { sessionId, action: 'shutdown' });
        return this.teardownEngineSafely(sessionId, engine, e => e.destroy(), 'destroy');
    }
    async destroyWithEscalation(sessionId, engine) {
        if (await this.teardownEngineSafely(sessionId, engine, e => e.destroy(), 'destroy'))
            return true;
        this.logger.warn(`Graceful destroy failed for session ${sessionId}; escalating to force-destroy`, {
            sessionId,
            action: 'destroy_escalate_force_destroy',
        });
        return this.teardownEngineSafely(sessionId, engine, e => e.forceDestroy(), 'force-destroy');
    }
    async teardownEngineSafely(sessionId, engine, teardown, label, sessionName) {
        const raw = teardown(engine);
        if (label === 'logout' && sessionName) {
            this.trackPendingCredentialTeardown(sessionName, raw);
        }
        let timer;
        try {
            await Promise.race([
                raw,
                new Promise((_, reject) => {
                    timer = setTimeout(() => reject(new Error(`engine.${label}() timed out`)), exports.ENGINE_TEARDOWN_TIMEOUT_MS);
                }),
            ]);
            return true;
        }
        catch (err) {
            this.logger.error(`Failed to ${label} engine for session ${sessionId}`, String(err), {
                sessionId,
                action: `engine_${label}_failed`,
            });
            return false;
        }
        finally {
            if (timer)
                clearTimeout(timer);
        }
    }
    trackPendingCredentialTeardown(sessionName, raw) {
        const tracked = raw.catch(() => undefined);
        const previous = this.pendingTeardowns.get(sessionName);
        const entry = previous ? Promise.allSettled([previous, tracked]).then(() => undefined) : tracked;
        this.pendingTeardowns.set(sessionName, entry);
        void entry.finally(() => {
            if (this.pendingTeardowns.get(sessionName) === entry) {
                this.pendingTeardowns.delete(sessionName);
            }
        });
    }
    async awaitPendingTeardown(sessionName) {
        const pending = this.pendingTeardowns.get(sessionName);
        if (!pending)
            return;
        let timer;
        const settled = await Promise.race([
            pending.then(() => true),
            new Promise(resolve => {
                timer = setTimeout(() => resolve(false), 10_000);
            }),
        ]);
        if (timer)
            clearTimeout(timer);
        if (!settled) {
            throw new common_1.ConflictException({
                statusCode: common_1.HttpStatus.CONFLICT,
                message: `A credential teardown for session '${sessionName}' is still in flight. Wait for it to ` +
                    'settle and retry.',
                error: 'Conflict',
                code: 'SESSION_NAME_TEARDOWN_PENDING',
            });
        }
    }
    async awaitInitialStatus(id, engine) {
        const pending = this.pendingInitialStatuses.get(id);
        if (!pending || pending.engine !== engine)
            return;
        let timer;
        const settled = await Promise.race([
            pending.promise.catch(() => undefined).then(() => true),
            new Promise(resolve => {
                timer = setTimeout(() => resolve(false), 10_000);
            }),
        ]);
        if (timer)
            clearTimeout(timer);
        if (!settled) {
            this.logger.warn(`Proceeding to retire session ${id} while its INITIALIZING status write is still wedged`, {
                sessionId: id,
                action: 'pending_initial_status_wait_exhausted',
            });
        }
    }
    evictAndForceDestroy(id, engine) {
        this.engines.deleteIfLive(id, engine);
        void this.teardownEngineSafely(id, engine, e => e.forceDestroy(), 'force-destroy');
    }
}
exports.SessionLifecycleFences = SessionLifecycleFences;
//# sourceMappingURL=session-lifecycle-fences.js.map