export type HookEvent = 'session:created' | 'session:starting' | 'session:ready' | 'session:qr' | 'session:disconnected' | 'session:error' | 'session:deleted' | 'message:received' | 'message:sending' | 'message:sent' | 'message:failed' | 'message:ack' | 'message:persisted' | 'message:deleted' | 'webhook:before' | 'webhook:queued' | 'webhook:delivered' | 'webhook:after' | 'webhook:error' | 'ingress:error';
export declare const KNOWN_HOOK_EVENTS: ReadonlySet<HookEvent>;
export declare function isKnownHookEvent(event: string): event is HookEvent;
export interface HookContext<T = unknown> {
    event: HookEvent;
    data: T;
    sessionId?: string;
    timestamp: Date;
    source: string;
}
export interface HookResult<T = unknown> {
    continue: boolean;
    data?: T;
    error?: Error;
}
export type HookHandler<T = unknown> = (ctx: HookContext<T>) => Promise<HookResult<T>>;
export interface HookRegistration {
    id: string;
    pluginId: string;
    event: HookEvent;
    handler: HookHandler;
    priority: number;
}
