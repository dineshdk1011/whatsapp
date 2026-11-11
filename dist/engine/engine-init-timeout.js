"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveAuthTimeoutMs = resolveAuthTimeoutMs;
exports.resolveEngineInitTimeoutMs = resolveEngineInitTimeoutMs;
function resolveAuthTimeoutMs() {
    const raw = process.env.WWEBJS_AUTH_TIMEOUT_MS?.trim();
    if (!raw || !/^\d+$/.test(raw)) {
        return undefined;
    }
    const ms = Number(raw);
    return Number.isSafeInteger(ms) && ms > 0 ? ms : undefined;
}
function resolveEngineInitTimeoutMs() {
    return Math.min(2_147_483_647, Math.max(60_000, (resolveAuthTimeoutMs() ?? 30_000) + 30_000));
}
//# sourceMappingURL=engine-init-timeout.js.map