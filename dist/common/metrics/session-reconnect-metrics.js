"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.incrementSessionReconnectAttempts = incrementSessionReconnectAttempts;
exports.getSessionReconnectAttemptsTotal = getSessionReconnectAttemptsTotal;
exports.incrementSessionReconnectLoopAlerts = incrementSessionReconnectLoopAlerts;
exports.getSessionReconnectLoopAlertsTotal = getSessionReconnectLoopAlertsTotal;
let reconnectAttemptsTotal = 0;
let reconnectLoopAlertsTotal = 0;
function incrementSessionReconnectAttempts() {
    reconnectAttemptsTotal += 1;
}
function getSessionReconnectAttemptsTotal() {
    return reconnectAttemptsTotal;
}
function incrementSessionReconnectLoopAlerts() {
    reconnectLoopAlertsTotal += 1;
}
function getSessionReconnectLoopAlertsTotal() {
    return reconnectLoopAlertsTotal;
}
//# sourceMappingURL=session-reconnect-metrics.js.map