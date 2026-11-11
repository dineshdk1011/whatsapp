"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginWorkerHost = void 0;
const logger_service_1 = require("../../../common/services/logger.service");
const logger = (0, logger_service_1.createLogger)('PluginWorkerHost');
const SEND_CAP_VERBS = new Set(['messages.sendText', 'messages.reply', 'conversation.send']);
const SEND_CAP_TIMEOUT_FACTOR = 4;
const MAX_WORKER_ERROR_CHARS = 500;
const MAX_WORKER_TEXT_CHARS = 8192;
const NON_STRING_WORKER_VALUE = '[non-string worker value]';
function workerText(value) {
    if (typeof value !== 'string')
        return NON_STRING_WORKER_VALUE;
    return value.length > MAX_WORKER_TEXT_CHARS ? `${value.slice(0, MAX_WORKER_TEXT_CHARS)}…[truncated]` : value;
}
const MAX_LATE_HOOK_CLAIMS = 32;
const PROGRESS_KINDS = new Set([
    'lifecycle-result',
    'hook-result',
    'webhook-result',
    'health-result',
    'search-result',
]);
class PluginWorkerHost {
    channel;
    capDispatcher;
    onHookSubscribe;
    onWebhookSubscribe;
    onLog;
    runWithHookGuard;
    maxInFlightCaps;
    onSearchProviderRegister;
    onExit;
    capTimeoutMs;
    livenessTimeoutMs;
    onUnresponsive;
    nextId = 1;
    ready = false;
    dead = false;
    readyWaiters = [];
    pending = new Map();
    hookPending = new Map();
    webhookPending = new Map();
    healthPending = new Map();
    searchPending = new Map();
    inFlightHookEvents = new Map();
    lateHookClaims = new Map();
    inFlightCaps = 0;
    terminated = false;
    lastWorkerError;
    probe;
    unresponsiveReported = false;
    constructor(channel, capDispatcher, onHookSubscribe, onWebhookSubscribe, onLog, runWithHookGuard, maxInFlightCaps, onSearchProviderRegister, onExit, capTimeoutMs, livenessTimeoutMs, onUnresponsive) {
        this.channel = channel;
        this.capDispatcher = capDispatcher;
        this.onHookSubscribe = onHookSubscribe;
        this.onWebhookSubscribe = onWebhookSubscribe;
        this.onLog = onLog;
        this.runWithHookGuard = runWithHookGuard;
        this.maxInFlightCaps = maxInFlightCaps;
        this.onSearchProviderRegister = onSearchProviderRegister;
        this.onExit = onExit;
        this.capTimeoutMs = capTimeoutMs;
        this.livenessTimeoutMs = livenessTimeoutMs;
        this.onUnresponsive = onUnresponsive;
        this.channel.onMessage(message => this.handleMessage(message));
        this.channel.onExit(code => this.handleExit(code));
    }
    incInFlightHook(event) {
        this.inFlightHookEvents.set(event, (this.inFlightHookEvents.get(event) ?? 0) + 1);
    }
    decInFlightHook(event) {
        const count = this.inFlightHookEvents.get(event);
        if (count === undefined)
            return;
        if (count <= 1)
            this.inFlightHookEvents.delete(event);
        else
            this.inFlightHookEvents.set(event, count - 1);
    }
    dispatchHook(options) {
        if (this.dead)
            return Promise.resolve({ continue: true });
        const id = this.nextId++;
        const inFlight = [...new Set([...(options.inFlight ?? []), options.event])];
        for (const event of inFlight)
            this.incInFlightHook(event);
        return new Promise(resolve => {
            let released = false;
            const release = () => {
                if (released)
                    return;
                released = true;
                this.lateHookClaims.delete(id);
                for (const event of inFlight)
                    this.decInFlightHook(event);
            };
            const settle = (result) => {
                release();
                resolve(result);
            };
            const timer = setTimeout(() => {
                options.onTimeout?.();
                this.probeLiveness();
                resolve({ continue: true });
                this.holdLateClaim(id, release);
            }, options.timeoutMs);
            this.hookPending.set(id, { resolve: settle, timer });
            this.channel.postMessage({
                kind: 'hook',
                id,
                event: options.event,
                data: options.data,
                sessionId: options.sessionId,
                source: options.source,
                config: options.config,
                inFlight,
            });
        });
    }
    holdLateClaim(id, release) {
        this.lateHookClaims.set(id, release);
        if (this.lateHookClaims.size <= MAX_LATE_HOOK_CLAIMS)
            return;
        const [oldest, giveBack] = this.lateHookClaims.entries().next().value;
        const waiter = this.hookPending.get(oldest);
        if (waiter)
            clearTimeout(waiter.timer);
        this.hookPending.delete(oldest);
        giveBack();
    }
    dispatchWebhook(options) {
        if (this.dead)
            return Promise.resolve({ ok: false, status: 502 });
        const id = this.nextId++;
        return new Promise(resolve => {
            const timer = setTimeout(() => {
                this.webhookPending.delete(id);
                options.onTimeout?.();
                this.probeLiveness();
                resolve({ ok: false, status: 504 });
            }, options.timeoutMs);
            this.webhookPending.set(id, { resolve, timer });
            this.channel.postMessage({
                kind: 'webhook',
                id,
                instanceId: options.instanceId,
                route: options.route,
                method: options.method,
                headers: options.headers,
                query: options.query,
                body: options.body,
                rawBody: options.rawBody,
                verified: options.verified,
                deliveryId: options.deliveryId,
                sessionId: options.sessionId,
                config: options.config,
            });
        });
    }
    dispatchSearch(options) {
        if (this.dead)
            return Promise.resolve({ ok: false, error: 'plugin worker is no longer running' });
        const id = this.nextId++;
        return new Promise(resolve => {
            const timer = setTimeout(() => {
                this.searchPending.delete(id);
                this.probeLiveness();
                resolve({ ok: false, error: 'search timed out' });
            }, options.timeoutMs);
            this.searchPending.set(id, { resolve, timer });
            this.channel.postMessage({ kind: 'search', id, query: options.query });
        });
    }
    load(mainPath, context, timeoutMs) {
        return new Promise((resolve, reject) => {
            if (this.dead)
                return reject(new Error('plugin worker is no longer running'));
            if (this.ready)
                return resolve();
            const waiter = {
                resolve,
                reject,
            };
            if (timeoutMs !== undefined) {
                waiter.timer = setTimeout(() => {
                    const index = this.readyWaiters.indexOf(waiter);
                    if (index !== -1)
                        this.readyWaiters.splice(index, 1);
                    reject(new Error(`plugin worker load timed out after ${timeoutMs}ms`));
                }, timeoutMs);
            }
            this.readyWaiters.push(waiter);
            this.channel.postMessage(context ? { kind: 'load', mainPath, context } : { kind: 'load', mainPath });
        });
    }
    runLifecycle(method, timeoutMs) {
        return new Promise((resolve, reject) => {
            if (this.dead)
                return reject(new Error('plugin worker is no longer running'));
            const id = this.nextId++;
            const entry = {
                resolve,
                reject,
            };
            if (timeoutMs !== undefined) {
                entry.timer = setTimeout(() => {
                    this.pending.delete(id);
                    reject(new Error(`plugin worker lifecycle '${method}' timed out after ${timeoutMs}ms`));
                }, timeoutMs);
            }
            this.pending.set(id, entry);
            this.channel.postMessage({ kind: 'lifecycle', id, method });
        });
    }
    sendConfigChange(config) {
        if (this.dead)
            return;
        this.channel.postMessage({ kind: 'config-change', config });
    }
    healthCheck(timeoutMs) {
        if (this.dead)
            return Promise.resolve({ healthy: false, message: 'plugin worker is no longer running' });
        const id = this.nextId++;
        return new Promise(resolve => {
            const timer = setTimeout(() => {
                this.healthPending.delete(id);
                resolve({ healthy: false, message: 'health check timed out' });
            }, timeoutMs);
            this.healthPending.set(id, { resolve, timer });
            this.channel.postMessage({ kind: 'health-check', id });
        });
    }
    probeLiveness() {
        if (this.livenessTimeoutMs === undefined || !this.onUnresponsive)
            return;
        if (this.dead || this.terminated || this.probe || this.unresponsiveReported)
            return;
        const id = this.nextId++;
        this.armProbe(id);
        this.channel.postMessage({ kind: 'ping', id });
    }
    armProbe(id) {
        if (this.probe)
            clearTimeout(this.probe.timer);
        const timer = setTimeout(() => setImmediate(() => {
            if (this.probe?.timer !== timer)
                return;
            this.probe = undefined;
            if (this.dead || this.terminated || this.unresponsiveReported)
                return;
            this.unresponsiveReported = true;
            this.onUnresponsive?.();
        }), this.livenessTimeoutMs);
        this.probe = { id, timer };
    }
    terminate() {
        this.terminated = true;
        return this.channel.terminate();
    }
    handleMessage(message) {
        if (typeof message !== 'object' || message === null)
            return;
        try {
            this.routeMessage(message);
        }
        catch (error) {
            logger.warn(`Dropped a malformed sandbox worker message: ${error instanceof Error ? error.message : String(error)}`, { action: 'sandbox_worker_message_dropped' });
        }
    }
    routeMessage(message) {
        if (this.probe && PROGRESS_KINDS.has(message.kind))
            this.armProbe(this.probe.id);
        switch (message.kind) {
            case 'ready':
                this.ready = true;
                this.drain(this.readyWaiters, w => {
                    if (w.timer)
                        clearTimeout(w.timer);
                    w.resolve();
                });
                break;
            case 'error': {
                const text = workerText(message.error);
                this.lastWorkerError = text.replace(/\s+/g, ' ').slice(0, MAX_WORKER_ERROR_CHARS);
                const error = new Error(text);
                this.drain(this.readyWaiters, w => {
                    if (w.timer)
                        clearTimeout(w.timer);
                    w.reject(error);
                });
                break;
            }
            case 'lifecycle-result': {
                const waiter = this.pending.get(message.id);
                if (!waiter)
                    return;
                this.pending.delete(message.id);
                if (waiter.timer)
                    clearTimeout(waiter.timer);
                if (message.ok)
                    waiter.resolve();
                else
                    waiter.reject(new Error(workerText(message.error)));
                break;
            }
            case 'cap':
                void this.handleCapRequest(message);
                break;
            case 'hook-subscribe':
                this.onHookSubscribe?.(message.event, message.priority);
                break;
            case 'webhook-subscribe':
                this.onWebhookSubscribe?.(message.route);
                break;
            case 'log':
                this.onLog?.(message.level, message.message, message.meta);
                break;
            case 'hook-result': {
                const waiter = this.hookPending.get(message.id);
                if (!waiter)
                    return;
                this.hookPending.delete(message.id);
                clearTimeout(waiter.timer);
                const result = { continue: message.continue };
                if (message.data !== undefined)
                    result.data = message.data;
                if (message.error !== undefined)
                    result.error = workerText(message.error);
                waiter.resolve(result);
                break;
            }
            case 'webhook-result': {
                const waiter = this.webhookPending.get(message.id);
                if (!waiter)
                    return;
                this.webhookPending.delete(message.id);
                clearTimeout(waiter.timer);
                waiter.resolve({
                    ok: message.error == null,
                    status: message.status,
                    headers: message.headers,
                    body: message.body,
                    error: message.error == null ? undefined : workerText(message.error),
                });
                break;
            }
            case 'health-result': {
                const waiter = this.healthPending.get(message.id);
                if (!waiter)
                    return;
                this.healthPending.delete(message.id);
                clearTimeout(waiter.timer);
                waiter.resolve({
                    healthy: message.healthy,
                    message: message.message === undefined ? undefined : workerText(message.message),
                });
                break;
            }
            case 'pong':
                if (this.probe?.id === message.id) {
                    clearTimeout(this.probe.timer);
                    this.probe = undefined;
                }
                break;
            case 'search-provider-register':
                this.onSearchProviderRegister?.();
                break;
            case 'search-result': {
                const waiter = this.searchPending.get(message.id);
                if (!waiter)
                    return;
                this.searchPending.delete(message.id);
                clearTimeout(waiter.timer);
                if (message.ok)
                    waiter.resolve({ ok: true, results: message.results });
                else
                    waiter.resolve({ ok: false, error: workerText(message.error) });
                break;
            }
        }
    }
    async handleCapRequest(message) {
        if (typeof message.verb !== 'string') {
            this.channel.postMessage({ kind: 'cap-result', id: message.id, ok: false, error: NON_STRING_WORKER_VALUE });
            return;
        }
        if (this.maxInFlightCaps !== undefined && this.inFlightCaps >= this.maxInFlightCaps) {
            this.channel.postMessage({
                kind: 'cap-result',
                id: message.id,
                ok: false,
                error: `capability call rejected: too many concurrent capability calls (limit ${this.maxInFlightCaps})`,
            });
            return;
        }
        if (!this.capDispatcher) {
            this.channel.postMessage({ kind: 'cap-result', id: message.id, ok: false, error: 'no capability dispatcher' });
            return;
        }
        this.inFlightCaps++;
        try {
            const dispatcher = this.capDispatcher;
            const run = () => dispatcher(message.verb, message.args);
            const claimed = Array.isArray(message.inFlight) ? message.inFlight : [];
            const inFlight = claimed.filter((e) => typeof e === 'string' && this.inFlightHookEvents.has(e));
            const work = this.runWithHookGuard && inFlight.length > 0 ? this.runWithHookGuard(inFlight, run) : run();
            const result = await this.withCapTimeout(message.verb, work);
            this.channel.postMessage({ kind: 'cap-result', id: message.id, ok: true, result });
        }
        catch (error) {
            this.channel.postMessage({
                kind: 'cap-result',
                id: message.id,
                ok: false,
                error: error instanceof Error ? error.message : String(error),
            });
        }
        finally {
            this.inFlightCaps--;
        }
    }
    withCapTimeout(verb, work) {
        if (this.capTimeoutMs === undefined)
            return work;
        const timeoutMs = SEND_CAP_VERBS.has(verb) ? this.capTimeoutMs * SEND_CAP_TIMEOUT_FACTOR : this.capTimeoutMs;
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                work.then(() => this.onLog?.('warn', `capability '${verb}' settled after the ${timeoutMs}ms host timeout; its late result was discarded`, { action: 'sandbox_cap_late_settle', verb }), (error) => this.onLog?.('warn', `capability '${verb}' failed after the ${timeoutMs}ms host timeout: ${error instanceof Error ? error.message : String(error)}`, { action: 'sandbox_cap_late_settle', verb }));
                reject(new Error(`capability '${verb}' timed out after ${timeoutMs}ms`));
            }, timeoutMs);
            work.then(result => {
                clearTimeout(timer);
                resolve(result);
            }, (error) => {
                clearTimeout(timer);
                reject(error instanceof Error ? error : new Error(String(error)));
            });
        });
    }
    handleExit(code) {
        this.dead = true;
        if (this.probe) {
            clearTimeout(this.probe.timer);
            this.probe = undefined;
        }
        const error = new Error(`plugin worker exited unexpectedly (code ${code})${this.lastWorkerError ? `: ${this.lastWorkerError}` : ''}`);
        this.drain(this.readyWaiters, w => {
            if (w.timer)
                clearTimeout(w.timer);
            w.reject(error);
        });
        this.pending.forEach(waiter => {
            if (waiter.timer)
                clearTimeout(waiter.timer);
            waiter.reject(error);
        });
        this.pending.clear();
        this.healthPending.forEach(({ resolve, timer }) => {
            clearTimeout(timer);
            resolve({ healthy: false, message: 'plugin worker exited' });
        });
        this.healthPending.clear();
        this.hookPending.forEach(({ resolve, timer }) => {
            clearTimeout(timer);
            resolve({ continue: true });
        });
        this.hookPending.clear();
        this.webhookPending.forEach(({ resolve, timer }) => {
            clearTimeout(timer);
            resolve({ ok: false, status: 502 });
        });
        this.webhookPending.clear();
        this.searchPending.forEach(({ resolve, timer }) => {
            clearTimeout(timer);
            resolve({ ok: false, error: 'plugin worker exited' });
        });
        this.searchPending.clear();
        this.onExit?.(code, this.terminated, this.lastWorkerError);
    }
    drain(waiters, fn) {
        const current = waiters.splice(0, waiters.length);
        current.forEach(fn);
    }
}
exports.PluginWorkerHost = PluginWorkerHost;
//# sourceMappingURL=plugin-worker-host.js.map