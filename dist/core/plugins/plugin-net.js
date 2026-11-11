"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.effectiveNetAllow = effectiveNetAllow;
exports.isNetHostAllowed = isNetHostAllowed;
exports.performPluginFetch = performPluginFetch;
const ssrf_guard_1 = require("../../common/security/ssrf-guard");
const DEFAULT_TIMEOUT_MS = 15000;
const MAX_TIMEOUT_MS = 30000;
const MAX_BODY_BYTES = 10 * 1024 * 1024;
const MAX_INFLIGHT_FETCHES = 16;
let inFlightFetches = 0;
function effectiveNetAllow(allow, allowConfigHosts, config) {
    const out = [...(allow ?? [])];
    for (const key of allowConfigHosts ?? []) {
        const raw = config[key];
        if (typeof raw !== 'string')
            continue;
        try {
            const u = new URL(raw);
            if (u.protocol !== 'https:' || u.username || u.password)
                continue;
            if (u.hostname.includes('*'))
                continue;
            out.push(`https://${u.hostname}:${u.port || '443'}`);
        }
        catch {
        }
    }
    return out;
}
function isNetHostAllowed(allow, url) {
    let parsed;
    try {
        parsed = new URL(url);
    }
    catch {
        return false;
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')
        return false;
    const list = allow ?? [];
    if (list.includes('*'))
        return true;
    const port = parsed.port || (parsed.protocol === 'https:' ? '443' : '80');
    return (list.includes(`${parsed.protocol}//${parsed.hostname}:${port}`) ||
        list.includes(`${parsed.hostname}:${port}`) ||
        list.includes(parsed.hostname));
}
async function performPluginFetch(url, init = {}, deps = {}) {
    const safeFetch = deps.fetch ?? ssrf_guard_1.withSafeFetch;
    const opts = init ?? {};
    const requested = typeof opts.timeoutMs === 'number' && Number.isFinite(opts.timeoutMs) ? opts.timeoutMs : DEFAULT_TIMEOUT_MS;
    const timeoutMs = Math.min(Math.max(Math.trunc(requested), 1), MAX_TIMEOUT_MS);
    if (inFlightFetches >= MAX_INFLIGHT_FETCHES) {
        throw new Error(`too many concurrent plugin net.fetch calls (max ${MAX_INFLIGHT_FETCHES}); retry shortly`);
    }
    inFlightFetches++;
    try {
        return await safeFetch(url, {
            method: opts.method ?? 'GET',
            headers: opts.headers,
            body: opts.body,
            signal: AbortSignal.timeout(timeoutMs),
        }, async (response) => {
            const declared = Number(response.headers.get('content-length') ?? '');
            if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
                throw new Error(`plugin net.fetch response exceeds the ${MAX_BODY_BYTES}-byte cap`);
            }
            const reader = response.body?.getReader();
            const chunks = [];
            let total = 0;
            if (reader) {
                for (;;) {
                    const { done, value } = (await reader.read());
                    if (done)
                        break;
                    if (!value)
                        continue;
                    total += value.byteLength;
                    if (total > MAX_BODY_BYTES) {
                        await reader.cancel().catch(() => undefined);
                        throw new Error(`plugin net.fetch response exceeds the ${MAX_BODY_BYTES}-byte cap`);
                    }
                    chunks.push(Buffer.from(value));
                }
            }
            const headers = {};
            response.headers.forEach((value, key) => {
                headers[key] = value;
            });
            return {
                ok: response.ok,
                status: response.status,
                statusText: response.statusText,
                headers,
                body: Buffer.concat(chunks).toString('utf-8'),
            };
        });
    }
    finally {
        inFlightFetches--;
    }
}
//# sourceMappingURL=plugin-net.js.map