export declare class ConcurrencyLimiter {
    private readonly max;
    private readonly maxQueued;
    private active;
    private readonly waiters;
    private reacquiring;
    private closed;
    constructor(max: number, maxQueued?: number);
    get maxCount(): number;
    get activeCount(): number;
    get queuedCount(): number;
    get reacquiringCount(): number;
    close(): void;
    run<T>(task: (yieldSlot: <R>(fn: () => Promise<R>) => Promise<R>) => Promise<T>): Promise<T>;
    private acquire;
    private release;
}
