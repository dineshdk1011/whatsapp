"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DASHBOARD_CSP_NONCE_PLACEHOLDER = void 0;
exports.injectDashboardCspNonce = injectDashboardCspNonce;
exports.DASHBOARD_CSP_NONCE_PLACEHOLDER = '__OPENWA_CSP_NONCE__';
function injectDashboardCspNonce(html, nonce) {
    return html.split(exports.DASHBOARD_CSP_NONCE_PLACEHOLDER).join(nonce);
}
//# sourceMappingURL=dashboard-csp.js.map