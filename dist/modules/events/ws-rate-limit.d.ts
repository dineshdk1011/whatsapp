export interface WsRateLimitConfig {
    framePerSecond: number;
    frameBurst: number;
    handshakeMax: number;
    handshakeWindowMs: number;
    maxSocketsPerKey: number;
}
export declare function readWsRateLimitConfig(env?: NodeJS.ProcessEnv): WsRateLimitConfig;
export declare class TokenBucketLimiter {
    private readonly refillPerSecond;
    private readonly capacity;
    private readonly now;
    private readonly maxKeys;
    private readonly buckets;
    constructor(refillPerSecond?: number, capacity?: number, now?: () => number, maxKeys?: number);
    allow(subject: string): boolean;
}
export declare class SlidingWindowLimiter {
    private readonly max;
    private readonly windowMs;
    private readonly now;
    private readonly maxKeys;
    private readonly hits;
    constructor(max?: number, windowMs?: number, now?: () => number, maxKeys?: number);
    allow(subject: string, reservation?: object): boolean;
    refund(subject: string, reservation?: object): void;
}
