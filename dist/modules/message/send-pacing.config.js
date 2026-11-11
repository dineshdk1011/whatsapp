"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeSendPacingConfig = computeSendPacingConfig;
exports.resolveSendPacingConfig = resolveSendPacingConfig;
const DEFAULT_WARMUP_SCHEDULE = [20, 40, 80, 160, 320, 640, 1000];
const DEFAULT_COLD_SCHEDULE = [5, 10, 20, 40, 60, 80, 100];
const DEFAULT_BREAKER_THRESHOLD = 5;
const DEFAULT_BREAKER_COOLDOWN_MS = 15 * 60_000;
const MIN_DAILY_CAP = 1;
const MAX_DAILY_CAP = 100_000;
const MIN_BREAKER_THRESHOLD = 1;
const MIN_BREAKER_COOLDOWN_MS = 1000;
function parseSchedule(raw, fallback) {
    if (raw !== undefined && ['', '0', 'off'].includes(raw.trim().toLowerCase())) {
        return fallback === DEFAULT_COLD_SCHEDULE ? [] : fallback;
    }
    if (!raw)
        return fallback;
    const parts = raw.split(',').map(part => Number(part.trim()));
    if (parts.length === 0 || parts.some(n => !Number.isFinite(n) || n < MIN_DAILY_CAP || n > MAX_DAILY_CAP)) {
        return fallback;
    }
    return parts.map(n => Math.floor(n));
}
function parsePositiveInt(raw, fallback, min) {
    const value = Number(raw);
    if (!Number.isFinite(value) || value < min)
        return fallback;
    return Math.floor(value);
}
function computeSendPacingConfig(env = process.env) {
    return {
        enabled: env.SEND_PACING_ENABLED === 'true',
        warmupSchedule: parseSchedule(env.SEND_PACING_WARMUP_SCHEDULE, DEFAULT_WARMUP_SCHEDULE),
        coldSchedule: parseSchedule(env.SEND_PACING_COLD_DAILY_CAP, DEFAULT_COLD_SCHEDULE),
        breakerThreshold: parsePositiveInt(env.SEND_PACING_BREAKER_THRESHOLD, DEFAULT_BREAKER_THRESHOLD, MIN_BREAKER_THRESHOLD),
        breakerCooldownMs: parsePositiveInt(env.SEND_PACING_BREAKER_COOLDOWN_MS, DEFAULT_BREAKER_COOLDOWN_MS, MIN_BREAKER_COOLDOWN_MS),
    };
}
function resolveSendPacingConfig(configService) {
    return configService?.get('sendPacing') ?? computeSendPacingConfig();
}
//# sourceMappingURL=send-pacing.config.js.map