"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pluginRestoringRejection = void 0;
exports.evaluatePreflight = evaluatePreflight;
const whatsapp_engine_interface_1 = require("../../engine/interfaces/whatsapp-engine.interface");
const PREFLIGHT_RETRY_AFTER_SECONDS = 5;
const retryable503 = (body) => ({
    status: 503,
    body,
    headers: { 'Retry-After': String(PREFLIGHT_RETRY_AFTER_SECONDS) },
});
const pluginRestoringRejection = () => retryable503('plugin restoring');
exports.pluginRestoringRejection = pluginRestoringRejection;
function evaluatePreflight(route, sessionScope, sessionStatus) {
    const checks = route.response?.preflight;
    if (!checks?.length)
        return null;
    for (const check of checks) {
        if (check.type === 'session-alive') {
            if (!sessionScope || sessionScope === '*')
                continue;
            if (!sessionStatus)
                continue;
            const status = sessionStatus(sessionScope);
            if (status === undefined || status === whatsapp_engine_interface_1.EngineStatus.FAILED)
                return retryable503('session not ready');
        }
    }
    return null;
}
//# sourceMappingURL=ingress-preflight.js.map