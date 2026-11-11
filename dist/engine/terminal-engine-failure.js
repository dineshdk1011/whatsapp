"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOGOUT_CLEANUP_FAILED_REASON = exports.ACCOUNT_REJECTED_REASON = exports.CONNECTION_REPLACED_REASON = exports.STALE_PROFILE_ADVICE = exports.AUTH_FAILURE_REASON = void 0;
exports.isKnownTerminalEngineFailure = isKnownTerminalEngineFailure;
exports.AUTH_FAILURE_REASON = 'Authentication failed';
exports.STALE_PROFILE_ADVICE = "WhatsApp Web's page context was destroyed during startup.";
exports.CONNECTION_REPLACED_REASON = 'Connection replaced by another instance (440)';
exports.ACCOUNT_REJECTED_REASON = 'Account rejected by WhatsApp (403)';
exports.LOGOUT_CLEANUP_FAILED_REASON = 'Logged out by WhatsApp, but the local credential cleanup failed';
const TERMINAL_PREFIXES = [
    exports.AUTH_FAILURE_REASON,
    exports.CONNECTION_REPLACED_REASON,
    exports.ACCOUNT_REJECTED_REASON,
    exports.LOGOUT_CLEANUP_FAILED_REASON,
];
function isKnownTerminalEngineFailure(reason) {
    return TERMINAL_PREFIXES.some(prefix => reason.startsWith(prefix)) || reason.includes(exports.STALE_PROFILE_ADVICE);
}
//# sourceMappingURL=terminal-engine-failure.js.map