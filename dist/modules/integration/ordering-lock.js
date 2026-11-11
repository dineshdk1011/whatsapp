"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyedAsyncLock = void 0;
exports.orderingKeyFor = orderingKeyFor;
class KeyedAsyncLock {
    tails = new Map();
    run(key, fn) {
        const prev = this.tails.get(key) ?? Promise.resolve();
        const next = prev.catch(() => undefined).then(fn);
        this.tails.set(key, next);
        void next
            .catch(() => undefined)
            .finally(() => {
            if (this.tails.get(key) === next)
                this.tails.delete(key);
        });
        return next;
    }
}
exports.KeyedAsyncLock = KeyedAsyncLock;
function orderingKeyFor(job) {
    return [job.pluginId, job.instanceId, job.providerConversationId ?? ''].join('\u0000');
}
//# sourceMappingURL=ordering-lock.js.map