"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.positiveIntFromEnv = positiveIntFromEnv;
exports.positiveIntOrDefault = positiveIntOrDefault;
function positiveIntFromEnv(name, fallback) {
    const parsed = Number.parseInt(process.env[name] ?? '', 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
function positiveIntOrDefault(raw, fallback) {
    if (!raw || raw.trim() === '')
        return fallback;
    const n = Number(raw);
    if (!Number.isFinite(n))
        return fallback;
    const i = Math.floor(n);
    return i >= 1 ? i : fallback;
}
//# sourceMappingURL=env-int.js.map