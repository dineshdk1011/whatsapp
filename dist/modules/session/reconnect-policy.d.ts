export interface ReconnectAttemptState {
    attempts: number;
    maxAttempts: number;
    baseDelay: number;
}
export interface ReconnectExhausted {
    kind: 'exhausted';
    reason: string;
}
export interface ReconnectScheduled {
    kind: 'schedule';
    delayMs: number;
    attempt: number;
    loopAlert: boolean;
}
export type ReconnectDecision = ReconnectExhausted | ReconnectScheduled;
export declare const RECONNECT_LOOP_ALERT_INTERVAL_ATTEMPTS = 5;
export declare const RECONNECT_DELAY_CAP_MS = 300000;
export declare const STABLE_READY_MS = 300000;
export declare function clampNumber(value: number, min: number, max: number): number;
export declare function clampReconnectDelay(rawDelay: number, baseDelay: number): number;
export declare function decideReconnect(state: ReconnectAttemptState, jitter?: number): ReconnectDecision;
