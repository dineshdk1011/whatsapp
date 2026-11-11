"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerSearchRegistry = void 0;
class WorkerSearchRegistry {
    post;
    handler;
    registered = false;
    constructor(post) {
        this.post = post;
    }
    register(handler) {
        this.handler = handler;
        if (this.registered)
            return;
        this.registered = true;
        this.post({ kind: 'search-provider-register' });
    }
    async handleSearch(message) {
        if (!this.handler) {
            this.post({ kind: 'search-result', id: message.id, ok: false, error: 'no search handler registered' });
            return;
        }
        try {
            const results = await this.handler(message.query);
            this.post({ kind: 'search-result', id: message.id, ok: true, results });
        }
        catch (err) {
            this.post({
                kind: 'search-result',
                id: message.id,
                ok: false,
                error: err instanceof Error ? err.message : String(err),
            });
        }
    }
}
exports.WorkerSearchRegistry = WorkerSearchRegistry;
//# sourceMappingURL=worker-search-registry.js.map