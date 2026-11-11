export declare const DEFAULT_SHUTDOWN_DELAY_MS = 3000;
export declare const DEFAULT_WEBHOOK_SHUTDOWN_DRAIN_MS = 5000;
export declare const SHUTDOWN_KILL_DEADLINE_MS = 75000;
export declare const SHUTDOWN_KILL_MARGIN_MS = 5000;
export declare const SHUTDOWN_TEARDOWN_LIMIT_MS: number;
export declare const MAX_TIMER_MS: number;
export declare function shutdownTeardownLimitMs(webhookDrainMs: number): number;
