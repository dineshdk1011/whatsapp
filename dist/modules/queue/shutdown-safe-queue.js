"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShutdownSafeQueue = exports.QUEUE_CLOSE_TIMEOUT_MS = void 0;
const bullmq_1 = require("bullmq");
const logger_service_1 = require("../../common/services/logger.service");
const logger = (0, logger_service_1.createLogger)('QueueShutdown');
exports.QUEUE_CLOSE_TIMEOUT_MS = 2000;
class ShutdownSafeQueue extends bullmq_1.Queue {
    async close() {
        let timer;
        try {
            await Promise.race([
                super.close(),
                new Promise((_, reject) => {
                    timer = setTimeout(() => reject(new Error(`close did not settle within ${exports.QUEUE_CLOSE_TIMEOUT_MS} ms`)), exports.QUEUE_CLOSE_TIMEOUT_MS);
                }),
            ]);
        }
        catch (err) {
            logger.warn('Queue close failed; dropping the connection and continuing shutdown', {
                queue: this.name,
                error: err instanceof Error ? err.message : String(err),
            });
            this.disconnect().catch(() => undefined);
        }
        finally {
            clearTimeout(timer);
        }
    }
}
exports.ShutdownSafeQueue = ShutdownSafeQueue;
//# sourceMappingURL=shutdown-safe-queue.js.map