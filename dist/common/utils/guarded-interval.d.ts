export declare function startGuardedInterval(task: () => Promise<unknown>, intervalMs: number, onError: (error: unknown) => void): () => void;
