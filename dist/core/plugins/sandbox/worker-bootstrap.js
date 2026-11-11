"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
const worker_capability_1 = require("./worker-capability");
const worker_hooks_1 = require("./worker-hooks");
const worker_webhooks_1 = require("./worker-webhooks");
const worker_search_registry_1 = require("./worker-search-registry");
const port = worker_threads_1.parentPort;
if (!port) {
    throw new Error('worker-bootstrap must be run as a worker thread');
}
const send = (message) => port.postMessage(message);
const errorMessage = (error) => (error instanceof Error ? error.message : String(error));
const capClient = new worker_capability_1.WorkerCapabilityClient(send);
const hookRegistry = new worker_hooks_1.WorkerHookRegistry(send);
const webhookRegistry = new worker_webhooks_1.WebhookRegistry(send);
const searchRegistry = new worker_search_registry_1.WorkerSearchRegistry(send);
const sendLog = (level, message, meta) => {
    try {
        send({ kind: 'log', level, message, meta });
    }
    catch {
        const error = meta?.error;
        send({ kind: 'log', level, message: String(message), meta: typeof error === 'string' ? { error } : undefined });
    }
};
const logger = {
    log: (message, meta) => sendLog('log', message, meta),
    debug: (message, meta) => sendLog('debug', message, meta),
    warn: (message, meta) => sendLog('warn', message, meta),
    error: (message, error, meta) => sendLog('error', message, error !== undefined ? { ...meta, error: errorMessage(error) } : meta),
};
let plugin = null;
let context = null;
let baseConfig = {};
port.on('message', (message) => {
    if (message.kind === 'ping') {
        send({ kind: 'pong', id: message.id });
        return;
    }
    if (message.kind === 'cap-result') {
        capClient.handleResult(message);
        return;
    }
    if (message.kind === 'hook') {
        void hookRegistry.handleHook(message);
        return;
    }
    if (message.kind === 'webhook') {
        void webhookRegistry.handleWebhook(message);
        return;
    }
    if (message.kind === 'search') {
        void searchRegistry.handleSearch(message);
        return;
    }
    void handle(message);
});
async function handle(message) {
    if (message.kind === 'load') {
        try {
            const mod = require(message.mainPath);
            const PluginCtor = mod.default ?? mod;
            plugin = new PluginCtor();
            const staticContext = message.context ?? { pluginId: 'unknown', config: {} };
            baseConfig = staticContext.config;
            context = {
                pluginId: staticContext.pluginId,
                get config() {
                    return worker_hooks_1.hookConfigStore.getStore()?.config ?? baseConfig;
                },
                logger,
                ...(0, worker_capability_1.buildSandboxContext)(capClient),
                registerHook: (event, handler, priority) => hookRegistry.register(event, handler, priority),
                registerWebhook: (route, handler) => webhookRegistry.register(route, handler),
                registerSearchProvider: (handler) => searchRegistry.register(handler),
            };
            send({ kind: 'ready' });
        }
        catch (error) {
            send({ kind: 'error', error: errorMessage(error) });
        }
        return;
    }
    if (message.kind === 'lifecycle') {
        try {
            await plugin?.[message.method]?.(context);
            send({ kind: 'lifecycle-result', id: message.id, ok: true });
        }
        catch (error) {
            send({ kind: 'lifecycle-result', id: message.id, ok: false, error: errorMessage(error) });
        }
        return;
    }
    if (message.kind === 'config-change') {
        baseConfig = message.config;
        void Promise.resolve()
            .then(() => plugin?.onConfigChange?.(context, message.config))
            .catch(error => logger.error('onConfigChange threw', error));
        return;
    }
    if (message.kind === 'health-check') {
        try {
            const result = plugin?.healthCheck
                ? (await plugin.healthCheck())
                : { healthy: true, message: 'Plugin does not implement health check' };
            send({ kind: 'health-result', id: message.id, healthy: result.healthy, message: result.message });
        }
        catch (error) {
            send({ kind: 'health-result', id: message.id, healthy: false, message: errorMessage(error) });
        }
    }
}
//# sourceMappingURL=worker-bootstrap.js.map