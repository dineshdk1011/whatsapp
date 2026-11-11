"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STABLE_READY_MS = exports.RECONNECT_DELAY_CAP_MS = exports.RECONNECT_LOOP_ALERT_INTERVAL_ATTEMPTS = void 0;
exports.clampNumber = clampNumber;
exports.clampReconnectDelay = clampReconnectDelay;
exports.decideReconnect = decideReconnect;
exports.RECONNECT_LOOP_ALERT_INTERVAL_ATTEMPTS = 5;
exports.RECONNECT_DELAY_CAP_MS = 300_000;
exports.STABLE_READY_MS = exports.RECONNECT_DELAY_CAP_MS;
function clampNumber(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
function clampReconnectDelay(rawDelay, baseDelay) {
    return clampNumber(Number.isNaN(rawDelay) ? baseDelay : rawDelay, 0, exports.RECONNECT_DELAY_CAP_MS);
}
function decideReconnect(state, jitter = Math.random() * 1000) {
    if (state.attempts >= state.maxAttempts) {
        return {
            kind: 'exhausted',
            reason: state.maxAttempts === 0
                ? 'Auto-reconnect is disabled (max attempts set to 0), so the dropped session was marked failed. Start it again manually.'
                : `Reconnection failed after ${state.attempts} attempts — restart the session.`,
        };
    }
    const delayMs = clampReconnectDelay(state.baseDelay * Math.pow(2, Math.min(state.attempts, 30)) + jitter, state.baseDelay);
    state.attempts++;
    return {
        kind: 'schedule',
        delayMs,
        attempt: state.attempts,
        loopAlert: state.attempts > 0 && state.attempts % exports.RECONNECT_LOOP_ALERT_INTERVAL_ATTEMPTS === 0,
    };
}
//# sourceMappingURL=reconnect-policy.js.map