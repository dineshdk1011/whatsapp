"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InboundRoom = void 0;
exports.deferred = deferred;
exports.roomState = roomState;
const concurrency_limiter_1 = require("../../common/utils/concurrency-limiter");
const engine_1 = require("../../engine");
function deferred() {
    let resolve;
    const promise = new Promise(r => (resolve = r));
    return { promise, resolve };
}
function roomState() {
    return { granted: false, abandoned: false, grant: deferred(), done: deferred(), holds: [] };
}
class InboundRoom {
    gate = new concurrency_limiter_1.ConcurrencyLimiter((0, engine_1.inboundMediaConcurrency)());
    lastRelease = Date.now();
    request(s) {
        return this.gate
            .run(async () => {
            if (s.abandoned)
                return;
            s.granted = true;
            s.grant.resolve(true);
            await s.done.promise;
            for (let i = 0; i < s.holds.length; i++)
                await s.holds[i];
        })
            .then(() => {
            this.lastRelease = Date.now();
        });
    }
    wait(s) {
        if (s.granted)
            return Promise.resolve(true);
        const window = 2 * (0, engine_1.inboundMediaTimeoutMs)();
        const asked = Date.now();
        const arm = (delay) => {
            const timer = setTimeout(() => {
                if (s.granted || s.abandoned)
                    return;
                const idle = Date.now() - Math.max(this.lastRelease, asked);
                if (idle < window)
                    return arm(window - idle);
                s.abandoned = true;
                s.grant.resolve(false);
            }, delay);
            timer.unref?.();
            void s.grant.promise.then(() => clearTimeout(timer));
        };
        arm(window);
        return s.grant.promise;
    }
    get idle() {
        return this.gate.activeCount === 0 && this.gate.queuedCount === 0;
    }
}
exports.InboundRoom = InboundRoom;
//# sourceMappingURL=inbound-room.js.map