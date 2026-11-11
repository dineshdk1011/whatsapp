"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerThreadChannel = void 0;
const worker_threads_1 = require("worker_threads");
class WorkerThreadChannel {
    worker;
    constructor(options) {
        this.worker = new worker_threads_1.Worker(options.workerEntry, {
            execArgv: options.execArgv,
            env: options.env,
            resourceLimits: options.maxOldGenerationSizeMb !== undefined
                ? { maxOldGenerationSizeMb: options.maxOldGenerationSizeMb }
                : undefined,
        });
    }
    postMessage(message) {
        this.worker.postMessage(message);
    }
    onMessage(handler) {
        this.worker.on('message', handler);
        this.worker.on('error', (error) => handler({ kind: 'error', error: error instanceof Error ? error.message : String(error) }));
    }
    onExit(handler) {
        this.worker.on('exit', handler);
    }
    async terminate() {
        await this.worker.terminate();
    }
}
exports.WorkerThreadChannel = WorkerThreadChannel;
//# sourceMappingURL=worker-thread-channel.js.map