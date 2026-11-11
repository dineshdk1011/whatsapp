"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveSessionScope = resolveSessionScope;
exports.sessionScopeVisible = sessionScopeVisible;
function resolveSessionScope(allowedSessions, requestedSessionId) {
    const scoped = allowedSessions != null && allowedSessions.length > 0;
    if (scoped) {
        return requestedSessionId ? allowedSessions.filter(s => s === requestedSessionId) : allowedSessions;
    }
    return requestedSessionId ? [requestedSessionId] : null;
}
function sessionScopeVisible(allowedSessions, sessionScope) {
    if (allowedSessions == null || allowedSessions.length === 0)
        return true;
    return sessionScope != null && sessionScope !== '*' && allowedSessions.includes(sessionScope);
}
//# sourceMappingURL=session-scope.js.map