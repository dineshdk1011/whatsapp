export declare enum AuditAction {
    API_KEY_CREATED = "api_key_created",
    API_KEY_UPDATED = "api_key_updated",
    API_KEY_USED = "api_key_used",
    API_KEY_REVOKED = "api_key_revoked",
    API_KEY_DELETED = "api_key_deleted",
    API_KEY_AUTH_FAILED = "api_key_auth_failed",
    RATE_LIMIT_EXCEEDED = "rate_limit_exceeded",
    QUEUE_BOARD_MUTATED = "queue_board_mutated",
    SESSION_CREATED = "session_created",
    SESSION_STARTED = "session_started",
    SESSION_STOPPED = "session_stopped",
    SESSION_FORCE_KILLED = "session_force_killed",
    SESSION_LOGGED_OUT = "session_logged_out",
    SESSION_DELETED = "session_deleted",
    SESSION_CONFIG_UPDATED = "session_config_updated",
    SESSION_QR_GENERATED = "session_qr_generated",
    SESSION_CONNECTED = "session_connected",
    SESSION_DISCONNECTED = "session_disconnected",
    SESSION_RESTRICTED = "session_restricted",
    SESSION_RESTRICTION_LIFTED = "session_restriction_lifted",
    SESSION_REBIND_REJECTED = "session_rebind_rejected",
    PHONE_SECOND_LID_REPORTED = "phone_second_lid_reported",
    MESSAGE_SENT = "message_sent",
    MESSAGE_FAILED = "message_failed",
    SEND_PACING_BLOCKED = "send_pacing_blocked",
    SEND_BREAKER_TRIPPED = "send_breaker_tripped",
    WEBHOOK_CREATED = "webhook_created",
    WEBHOOK_DELETED = "webhook_deleted",
    WEBHOOK_TRIGGERED = "webhook_triggered",
    WEBHOOK_FAILED = "webhook_failed",
    WEBHOOK_DELIVERIES_REDRIVEN = "webhook_deliveries_redriven",
    INTEGRATION_INSTANCE_CREATED = "integration_instance_created",
    INTEGRATION_INSTANCE_UPDATED = "integration_instance_updated",
    INTEGRATION_INSTANCE_SECRET_REGENERATED = "integration_instance_secret_regenerated",
    INTEGRATION_INSTANCE_DELETED = "integration_instance_deleted",
    INTEGRATION_INSTANCE_REDRIVEN = "integration_instance_redriven",
    PLUGIN_INSTALLED = "plugin_installed",
    PLUGIN_UPDATED = "plugin_updated",
    PLUGIN_UNINSTALLED = "plugin_uninstalled",
    PLUGIN_ENABLED = "plugin_enabled",
    PLUGIN_DISABLED = "plugin_disabled",
    PLUGIN_CONFIG_UPDATED = "plugin_config_updated",
    PLUGIN_SESSIONS_UPDATED = "plugin_sessions_updated",
    INFRA_CONFIG_SAVED = "infra_config_saved",
    INFRA_RESTART_REQUESTED = "infra_restart_requested",
    INFRA_DATA_EXPORTED = "infra_data_exported",
    INFRA_DATA_IMPORTED = "infra_data_imported",
    INFRA_STORAGE_EXPORTED = "infra_storage_exported",
    INFRA_STORAGE_IMPORTED = "infra_storage_imported"
}
export declare enum AuditSeverity {
    INFO = "info",
    WARN = "warn",
    ERROR = "error"
}
export declare class AuditLog {
    id: string;
    action: AuditAction;
    severity: AuditSeverity;
    apiKeyId: string | null;
    apiKeyName: string | null;
    sessionId: string | null;
    sessionName: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    method: string | null;
    path: string | null;
    statusCode: number | null;
    metadata: Record<string, unknown> | null;
    errorMessage: string | null;
    createdAt: Date;
}
