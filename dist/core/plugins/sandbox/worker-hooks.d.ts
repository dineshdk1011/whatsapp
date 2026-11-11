import { AsyncLocalStorage } from 'async_hooks';
import { WorkerToHostMessage, HostToWorkerMessage } from './protocol';
export declare const hookConfigStore: AsyncLocalStorage<{
    config?: Record<string, unknown>;
    inFlight?: string[];
}>;
export interface WorkerHookContext {
    event: string;
    data: unknown;
    sessionId?: string;
    source: string;
    timestamp: Date;
}
export interface WorkerHookResult {
    continue: boolean;
    data?: unknown;
    error?: Error;
}
export type WorkerHookHandler = (ctx: WorkerHookContext) => Promise<WorkerHookResult> | WorkerHookResult;
export declare class WorkerHookRegistry {
    private readonly post;
    private readonly handlers;
    constructor(post: (message: WorkerToHostMessage) => void);
    register(event: string, handler: WorkerHookHandler, rawPriority?: unknown): void;
    handleHook(message: Extract<HostToWorkerMessage, {
        kind: 'hook';
    }>): Promise<void>;
    private dispatch;
}
