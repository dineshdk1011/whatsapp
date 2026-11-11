"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConcurrencyLimiter = void 0;
class ConcurrencyLimiter {
    max;
    maxQueued;
    active = 0;
    waiters = [];
    reacquiring = 0;
    closed = false;
    constructor(max, maxQueued = Infinity) {
        this.max = max;
        this.maxQueued = maxQueued;
        this.max = Math.max(1, Math.floor(max));
        this.maxQueued = Math.max(0, Math.floor(maxQueued));
    }
    get maxCount() {
        return this.max;
    }
    get activeCount() {
        return this.active;
    }
    get queuedCount() {
        return this.waiters.length;
    }
    get reacquiringCount() {
        return this.reacquiring;
    }
    close() {
        this.closed = true;
        const parked = this.waiters.splice(0);
        for (const wake of parked) {
            wake(new Error('ConcurrencyLimiter closed'));
        }
    }
    async run(task) {
        const parked = this.acquire(true);
        if (parked)
            await parked;
        let held = true;
        const yieldSlot = async (fn) => {
            if (!held)
                return fn();
            held = false;
            this.release();
            try {
                return await fn();
            }
            finally {
                const reparked = this.acquire(false);
                if (reparked) {
                    this.reacquiring++;
                    try {
                        await reparked;
                    }
                    finally {
                        this.reacquiring--;
                    }
                }
                held = true;
            }
        };
        try {
            return await task(yieldSlot);
        }
        finally {
            if (held)
                this.release();
        }
    }
    acquire(bounded) {
        if (this.closed) {
            throw new Error('ConcurrencyLimiter closed');
        }
        if (this.active < this.max) {
            this.active++;
            return undefined;
        }
        if (bounded && this.waiters.length - this.reacquiring >= this.maxQueued) {
            throw new Error('ConcurrencyLimiter queue full');
        }
        return new Promise((resolve, reject) => this.waiters.push(error => (error ? reject(error) : resolve())));
    }
    release() {
        const next = this.waiters.shift();
        if (next) {
            next();
        }
        else {
            this.active--;
        }
    }
}
exports.ConcurrencyLimiter = ConcurrencyLimiter;
//# sourceMappingURL=concurrency-limiter.js.map