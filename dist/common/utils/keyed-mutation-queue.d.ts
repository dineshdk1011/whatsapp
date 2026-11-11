export declare class KeyedMutationQueue {
    private readonly onUnexpectedError;
    private readonly chains;
    constructor(onUnexpectedError?: (key: string, err: unknown) => void);
    enqueue(key: string, work: () => Promise<void>): void;
    get size(): number;
}
