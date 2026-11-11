"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookRegistry = void 0;
const worker_hooks_1 = require("./worker-hooks");
class WebhookRegistry {
    post;
    handlers = new Map();
    constructor(post) {
        this.post = post;
    }
    register(route, handler) {
        this.handlers.set(route, handler);
        this.post({ kind: 'webhook-subscribe', route });
    }
    async handleWebhook(message) {
        const handler = this.handlers.get(message.route);
        if (!handler) {
            this.post({ kind: 'webhook-result', id: message.id, status: 404, error: 'no handler for route' });
            return;
        }
        const run = async () => {
            try {
                const result = await handler({
                    instanceId: message.instanceId,
                    method: message.method,
                    headers: message.headers,
                    query: message.query,
                    body: message.body,
                    rawBody: message.rawBody,
                    verified: message.verified,
                    deliveryId: message.deliveryId,
                    sessionId: message.sessionId,
                });
                this.post({
                    kind: 'webhook-result',
                    id: message.id,
                    status: result?.status ?? 200,
                    headers: result?.headers,
                    body: result?.body,
                });
            }
            catch (err) {
                this.post({
                    kind: 'webhook-result',
                    id: message.id,
                    status: 500,
                    error: err instanceof Error ? err.message : String(err),
                });
            }
        };
        if (message.config !== undefined)
            await worker_hooks_1.hookConfigStore.run({ config: message.config }, run);
        else
            await run();
    }
}
exports.WebhookRegistry = WebhookRegistry;
//# sourceMappingURL=worker-webhooks.js.map