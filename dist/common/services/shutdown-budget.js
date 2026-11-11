"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_TIMER_MS = exports.SHUTDOWN_TEARDOWN_LIMIT_MS = exports.SHUTDOWN_KILL_MARGIN_MS = exports.SHUTDOWN_KILL_DEADLINE_MS = exports.DEFAULT_WEBHOOK_SHUTDOWN_DRAIN_MS = exports.DEFAULT_SHUTDOWN_DELAY_MS = void 0;
exports.shutdownTeardownLimitMs = shutdownTeardownLimitMs;
exports.DEFAULT_SHUTDOWN_DELAY_MS = 3_000;
exports.DEFAULT_WEBHOOK_SHUTDOWN_DRAIN_MS = 5_000;
exports.SHUTDOWN_KILL_DEADLINE_MS = 75_000;
exports.SHUTDOWN_KILL_MARGIN_MS = 5_000;
exports.SHUTDOWN_TEARDOWN_LIMIT_MS = exports.SHUTDOWN_KILL_DEADLINE_MS - exports.DEFAULT_SHUTDOWN_DELAY_MS - exports.SHUTDOWN_KILL_MARGIN_MS;
exports.MAX_TIMER_MS = 2 ** 31 - 1;
function shutdownTeardownLimitMs(webhookDrainMs) {
    const limit = exports.SHUTDOWN_TEARDOWN_LIMIT_MS + webhookDrainMs - exports.DEFAULT_WEBHOOK_SHUTDOWN_DRAIN_MS;
    return Math.min(limit, exports.MAX_TIMER_MS);
}
//# sourceMappingURL=shutdown-budget.js.map