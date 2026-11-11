"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INTENTIONALLY_UNEMITTED_ACTIONS = void 0;
const audit_log_entity_1 = require("./entities/audit-log.entity");
exports.INTENTIONALLY_UNEMITTED_ACTIONS = {
    [audit_log_entity_1.AuditAction.API_KEY_USED]: 'Not emitted: would fire on every authenticated request, which is too high-volume for the audit log. Authentication failures are audited (API_KEY_AUTH_FAILED); successful authentication is intentionally not.',
    [audit_log_entity_1.AuditAction.SESSION_CONNECTED]: 'Not emitted: an engine-level lifecycle transition, redundant with sessions.status and the SessionEngineLifecycle lastDispatchedStatus map. User-initiated lifecycle (SESSION_STARTED / SESSION_STOPPED) is audited.',
    [audit_log_entity_1.AuditAction.MESSAGE_SENT]: 'Not emitted: per outbound message, fully redundant with the messages table, which persists every send with its outcome.',
    [audit_log_entity_1.AuditAction.MESSAGE_FAILED]: 'Not emitted: per failed send, redundant with the outcome persisted on the messages table.',
    [audit_log_entity_1.AuditAction.WEBHOOK_CREATED]: 'Not yet emitted: webhook create/delete is not currently audited. It is low-volume and security-relevant, so wiring it is a candidate for a separate enhancement; the gate will validate the emission once added, and this entry must then be removed.',
    [audit_log_entity_1.AuditAction.WEBHOOK_DELETED]: 'Not yet emitted: webhook create/delete is not currently audited. It is low-volume and security-relevant, so wiring it is a candidate for a separate enhancement; the gate will validate the emission once added, and this entry must then be removed.',
    [audit_log_entity_1.AuditAction.WEBHOOK_TRIGGERED]: 'Not emitted: per delivery attempt, redundant with the webhook_delivery_failures dead-letter table and the openwa_webhook_delivery_failures_total counter.',
    [audit_log_entity_1.AuditAction.WEBHOOK_FAILED]: 'Not emitted: per failed delivery, redundant with the webhook_delivery_failures dead-letter table and the openwa_webhook_delivery_failures_total counter.',
};
//# sourceMappingURL=intentionally-unemitted-actions.js.map