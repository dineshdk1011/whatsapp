"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerHookRegistry = exports.hookConfigStore = void 0;
const async_hooks_1 = require("async_hooks");
const hook_results_1 = require("../../hooks/hook-results");
exports.hookConfigStore = new async_hooks_1.AsyncLocalStorage();
class WorkerHookRegistry {
    post;
    handlers = new Map();
    constructor(post) {
        this.post = post;
    }
    register(event, handler, rawPriority = 100) {
        const priority = typeof rawPriority === 'number' && Number.isFinite(rawPriority) ? rawPriority : 100;
        const list = this.handlers.get(event);
        if (list) {
            const lowest = list[0].priority;
            list.push({ handler, priority });
            list.sort((a, b) => a.priority - b.priority);
            if (priority < lowest)
                this.post({ kind: 'hook-subscribe', event, priority });
            return;
        }
        this.handlers.set(event, [{ handler, priority }]);
        this.post({ kind: 'hook-subscribe', event, priority });
    }
    async handleHook(message) {
        const store = {
            config: message.config,
            inFlight: message.inFlight ?? [message.event],
        };
        try {
            await exports.hookConfigStore.run(store, () => this.dispatch(message));
        }
        finally {
            store.inFlight = undefined;
        }
    }
    async dispatch(message) {
        const list = this.handlers.get(message.event) ?? [];
        const check = hook_results_1.HOOK_RESULT_ACCEPT[message.event];
        const accept = check?.(message.data) ? check : undefined;
        let data = message.data;
        let shouldContinue = true;
        let firstError;
        for (const { handler } of list) {
            try {
                const result = await handler({
                    event: message.event,
                    data,
                    sessionId: message.sessionId,
                    source: message.source,
                    timestamp: new Date(),
                });
                if (result.error === undefined && result.data !== undefined && (accept?.(result.data) ?? true)) {
                    data = result.data;
                }
                if (!result.continue) {
                    shouldContinue = false;
                    break;
                }
                if (result.error)
                    throw result.error;
            }
            catch (error) {
                firstError ??= error instanceof Error ? error.message : String(error);
            }
        }
        const result = {
            kind: 'hook-result',
            id: message.id,
            continue: shouldContinue,
            data,
        };
        if (firstError !== undefined)
            result.error = firstError;
        try {
            this.post(result);
        }
        catch (error) {
            this.post({
                kind: 'hook-result',
                id: message.id,
                continue: shouldContinue,
                error: firstError ?? `hook result could not be sent: ${error instanceof Error ? error.message : String(error)}`,
            });
        }
    }
}
exports.WorkerHookRegistry = WorkerHookRegistry;
//# sourceMappingURL=worker-hooks.js.map