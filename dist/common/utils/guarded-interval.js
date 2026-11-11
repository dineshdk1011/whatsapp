"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startGuardedInterval = startGuardedInterval;
function startGuardedInterval(task, intervalMs, onError) {
    let running = false;
    const run = () => {
        if (running)
            return;
        running = true;
        void (async () => task())()
            .catch(onError)
            .finally(() => (running = false));
    };
    run();
    const timer = setInterval(run, intervalMs);
    timer.unref?.();
    return () => clearInterval(timer);
}
//# sourceMappingURL=guarded-interval.js.map