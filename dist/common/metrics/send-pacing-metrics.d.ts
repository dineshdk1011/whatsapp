export type SendPacingRefusalReason = 'daily_cap' | 'cold_daily_cap' | 'breaker_open';
export declare function incrementSendPacingRefusals(reason: SendPacingRefusalReason): void;
export declare function getSendPacingRefusals(): ReadonlyMap<SendPacingRefusalReason, number>;
export declare function resetSendPacingRefusals(): void;
