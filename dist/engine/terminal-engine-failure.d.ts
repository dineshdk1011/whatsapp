export declare const AUTH_FAILURE_REASON = "Authentication failed";
export declare const STALE_PROFILE_ADVICE = "WhatsApp Web's page context was destroyed during startup.";
export declare const CONNECTION_REPLACED_REASON = "Connection replaced by another instance (440)";
export declare const ACCOUNT_REJECTED_REASON = "Account rejected by WhatsApp (403)";
export declare const LOGOUT_CLEANUP_FAILED_REASON = "Logged out by WhatsApp, but the local credential cleanup failed";
export declare function isKnownTerminalEngineFailure(reason: string): boolean;
