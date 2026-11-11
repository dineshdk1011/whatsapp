"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_WORKER_CLOSE_WAIT_MS = void 0;
exports.startedWorker = startedWorker;
exports.closeWorkerIfStarted = closeWorkerIfStarted;
const logger_service_1 = require("../../../common/services/logger.service");
exports.MAX_WORKER_CLOSE_WAIT_MS = 10_000;
const logger = (0, logger_service_1.createLogger)('QueueWorkerShutdown');
function startedWorker(host) {
    try {
        return host.worker;
    }
    catch {
        return undefined;
    }
}
async function closeWorkerIfStarted(host, waitMs) {
    const worker = startedWorker(host);
    if (!worker)
        return;
    const limitMs = Math.min(waitMs, exports.MAX_WORKER_CLOSE_WAIT_MS);
    let timer;
    const closed = await Promise.race([
        worker.close().then(() => true, () => true),
        new Promise(resolve => {
            timer = setTimeout(() => resolve(false), limitMs);
        }),
    ]);
    clearTimeout(timer);
    if (!closed) {
        logger.warn('Queue worker did not close in time; continuing shutdown', { queue: worker.name, waitMs: limitMs });
        worker.close = () => Promise.resolve();
    }
}
//# sourceMappingURL=close-worker.js.map