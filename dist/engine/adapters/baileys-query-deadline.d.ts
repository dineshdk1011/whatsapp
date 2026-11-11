export declare function withQueryDeadline<T>(work: Promise<T>, timeoutMs: number, detail: string): Promise<T>;
export declare function confirmedWrite<T>(work: Promise<T>, timeoutMs: number, operation: string): Promise<T>;
export declare const BAILEYS_QUERY_BUDGET_MS = 30000;
