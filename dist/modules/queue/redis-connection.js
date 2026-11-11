"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QUEUE_COMMAND_TIMEOUT_MS = void 0;
exports.queueConnectionOptions = queueConnectionOptions;
exports.queuePrefix = queuePrefix;
exports.queueRootOptions = queueRootOptions;
exports.producerConnectWaitMs = producerConnectWaitMs;
exports.producerReady = producerReady;
exports.workerConnectionOptions = workerConnectionOptions;
exports.webhookWorkerConcurrency = webhookWorkerConcurrency;
exports.ingressWorkerConcurrency = ingressWorkerConcurrency;
const configuration_1 = require("../../config/configuration");
const redis_options_1 = require("../../config/redis-options");
exports.QUEUE_COMMAND_TIMEOUT_MS = 2000;
function queueConnectionOptions() {
    return { ...(0, redis_options_1.redisConnectionOptions)(), enableOfflineQueue: false, commandTimeout: exports.QUEUE_COMMAND_TIMEOUT_MS };
}
function queuePrefix() {
    return process.env.QUEUE_PREFIX?.trim() || undefined;
}
function queueRootOptions() {
    const prefix = queuePrefix();
    return { connection: queueConnectionOptions(), ...(prefix ? { prefix } : {}) };
}
function producerConnectWaitMs() {
    return Math.min((0, redis_options_1.redisConnectionOptions)().connectTimeout || redis_options_1.DEFAULT_REDIS_CONNECT_TIMEOUT_MS, configuration_1.MAX_TIMER_MS);
}
const firstConnects = new WeakMap();
async function producerReady(queue) {
    let first = firstConnects.get(queue);
    if (!first) {
        const timeoutMs = producerConnectWaitMs();
        const ready = queue.waitUntilReady();
        let timer;
        const wait = Promise.race([
            ready,
            new Promise((_resolve, reject) => {
                timer = setTimeout(() => reject(new Error(`Redis has not connected within ${timeoutMs}ms`)), timeoutMs);
                timer.unref();
            }),
        ]).finally(() => clearTimeout(timer));
        const entry = { connected: false, wait };
        ready.then(() => (entry.connected = true), () => undefined);
        firstConnects.set(queue, (first = entry));
    }
    if (!first.connected)
        await first.wait;
}
function workerConnectionOptions() {
    return (0, redis_options_1.redisConnectionOptions)();
}
const DEFAULT_WEBHOOK_WORKER_CONCURRENCY = 10;
function webhookWorkerConcurrency() {
    return (0, configuration_1.resolveNonNegativeIntEnv)(process.env.WEBHOOK_WORKER_CONCURRENCY, 0) || DEFAULT_WEBHOOK_WORKER_CONCURRENCY;
}
const DEFAULT_INGRESS_WORKER_CONCURRENCY = 10;
function ingressWorkerConcurrency() {
    return (0, configuration_1.resolveNonNegativeIntEnv)(process.env.INGRESS_WORKER_CONCURRENCY, 0) || DEFAULT_INGRESS_WORKER_CONCURRENCY;
}
//# sourceMappingURL=redis-connection.js.map