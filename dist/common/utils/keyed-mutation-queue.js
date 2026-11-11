"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyedMutationQueue = void 0;
class KeyedMutationQueue {
    onUnexpectedError;
    chains = new Map();
    constructor(onUnexpectedError = () => { }) {
        this.onUnexpectedError = onUnexpectedError;
    }
    enqueue(key, work) {
        const prior = this.chains.get(key) ?? Promise.resolve();
        const next = prior
            .catch(() => undefined)
            .then(work)
            .catch(err => this.onUnexpectedError(key, err));
        this.chains.set(key, next);
        void next.finally(() => {
            if (this.chains.get(key) === next) {
                this.chains.delete(key);
            }
        });
    }
    get size() {
        return this.chains.size;
    }
}
exports.KeyedMutationQueue = KeyedMutationQueue;
//# sourceMappingURL=keyed-mutation-queue.js.map