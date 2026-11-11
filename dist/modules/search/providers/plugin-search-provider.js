"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginSearchProvider = void 0;
exports.validatePluginSearchResults = validatePluginSearchResults;
const common_1 = require("@nestjs/common");
const SEARCH_HIT_STRING_FIELDS = [
    'messageId',
    'waMessageId',
    'sessionId',
    'chatId',
    'body',
    'snippet',
    'type',
    'direction',
    'from',
];
function validatePluginSearchResults(results) {
    if (!results || typeof results !== 'object' || Array.isArray(results))
        return 'results must be an object';
    const r = results;
    if (!Array.isArray(r.hits))
        return 'results.hits must be an array';
    if (typeof r.total !== 'number' || !Number.isFinite(r.total) || r.total < 0) {
        return 'results.total must be a finite number >= 0';
    }
    if (typeof r.tookMs !== 'number' || !Number.isFinite(r.tookMs) || r.tookMs < 0) {
        return 'results.tookMs must be a finite number >= 0';
    }
    if (typeof r.provider !== 'string' || r.provider.length === 0)
        return 'results.provider must be a non-empty string';
    for (const [index, hit] of r.hits.entries()) {
        if (!hit || typeof hit !== 'object' || Array.isArray(hit))
            return `results.hits[${index}] must be an object`;
        const h = hit;
        for (const field of SEARCH_HIT_STRING_FIELDS) {
            if (typeof h[field] !== 'string')
                return `results.hits[${index}].${field} must be a string`;
        }
        if (typeof h.timestamp !== 'number' || !Number.isFinite(h.timestamp)) {
            return `results.hits[${index}].timestamp must be a finite number`;
        }
        if (h.score !== undefined && (typeof h.score !== 'number' || !Number.isFinite(h.score))) {
            return `results.hits[${index}].score must be a finite number when present`;
        }
    }
    return null;
}
class PluginSearchProvider {
    label;
    transport;
    timeoutMs;
    id;
    constructor(pluginId, label, transport, timeoutMs) {
        this.label = label;
        this.transport = transport;
        this.timeoutMs = timeoutMs;
        this.id = `plugin:${pluginId}`;
    }
    async search(query) {
        if (query.chatIds !== undefined) {
            if (query.chatIds.length === 0)
                return { hits: [], total: 0, tookMs: 0, provider: this.id };
            throw new common_1.ForbiddenException('Chat-restricted search requires the built-in search provider');
        }
        const pluginQuery = { ...query };
        delete pluginQuery.chatIdAliases;
        delete pluginQuery.fromAliases;
        const reply = await this.transport.dispatchSearch({ query: pluginQuery, timeoutMs: this.timeoutMs });
        if (!reply.ok)
            throw new common_1.ServiceUnavailableException(reply.error);
        const invalid = validatePluginSearchResults(reply.results);
        if (invalid)
            throw new common_1.BadGatewayException(`Search provider ${this.id} returned invalid results: ${invalid}`);
        const results = {
            ...reply.results,
            total: Math.trunc(reply.results.total),
            tookMs: Math.round(reply.results.tookMs),
            hits: reply.results.hits.map(h => ({ ...h, timestamp: Math.trunc(h.timestamp) })),
        };
        const sessionFilter = query.sessionIds?.length ? new Set(query.sessionIds) : null;
        if (!sessionFilter)
            return results;
        const scoped = results.hits.filter(h => sessionFilter.has(h.sessionId));
        const leaked = results.hits.length - scoped.length;
        return {
            hits: scoped,
            total: leaked > 0 ? scoped.length : results.total,
            tookMs: results.tookMs,
            provider: results.provider,
        };
    }
    async health() {
        const result = await this.transport.healthCheck(this.timeoutMs);
        return { ok: result.healthy, detail: result.message };
    }
}
exports.PluginSearchProvider = PluginSearchProvider;
//# sourceMappingURL=plugin-search-provider.js.map