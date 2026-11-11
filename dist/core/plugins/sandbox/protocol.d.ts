import type { SearchQuery, SearchResults } from '../../../modules/search/search.types';
export type PluginLifecycleMethod = 'onLoad' | 'onEnable' | 'onDisable' | 'onUnload';
export interface SandboxStaticContext {
    pluginId: string;
    config: Record<string, unknown>;
}
export type PluginLogLevel = 'log' | 'debug' | 'warn' | 'error';
export type HostToWorkerMessage = {
    kind: 'load';
    mainPath: string;
    context?: SandboxStaticContext;
} | {
    kind: 'lifecycle';
    id: number;
    method: PluginLifecycleMethod;
} | {
    kind: 'cap-result';
    id: number;
    ok: true;
    result: unknown;
} | {
    kind: 'cap-result';
    id: number;
    ok: false;
    error: string;
} | {
    kind: 'hook';
    id: number;
    event: string;
    data: unknown;
    sessionId?: string;
    source: string;
    config?: Record<string, unknown>;
    inFlight?: string[];
} | {
    kind: 'config-change';
    config: Record<string, unknown>;
} | {
    kind: 'health-check';
    id: number;
} | {
    kind: 'webhook';
    id: number;
    instanceId: string;
    route: string;
    method: string;
    headers: Record<string, string>;
    query: Record<string, string>;
    body: string;
    rawBody: string;
    verified: boolean;
    deliveryId: string;
    sessionId?: string;
    config?: Record<string, unknown>;
} | {
    kind: 'search';
    id: number;
    query: SearchQuery;
} | {
    kind: 'ping';
    id: number;
};
export type WorkerToHostMessage = {
    kind: 'ready';
} | {
    kind: 'lifecycle-result';
    id: number;
    ok: true;
} | {
    kind: 'lifecycle-result';
    id: number;
    ok: false;
    error: string;
} | {
    kind: 'cap';
    id: number;
    verb: string;
    args: unknown[];
    inFlight?: string[];
} | {
    kind: 'hook-subscribe';
    event: string;
    priority?: number;
} | {
    kind: 'hook-result';
    id: number;
    continue: boolean;
    data?: unknown;
    error?: string;
} | {
    kind: 'log';
    level: PluginLogLevel;
    message: string;
    meta?: Record<string, unknown>;
} | {
    kind: 'health-result';
    id: number;
    healthy: boolean;
    message?: string;
} | {
    kind: 'webhook-subscribe';
    route: string;
} | {
    kind: 'webhook-result';
    id: number;
    status: number;
    headers?: Record<string, string>;
    body?: string;
    error?: string;
} | {
    kind: 'search-provider-register';
} | {
    kind: 'search-result';
    id: number;
    ok: true;
    results: SearchResults;
} | {
    kind: 'search-result';
    id: number;
    ok: false;
    error: string;
} | {
    kind: 'pong';
    id: number;
} | {
    kind: 'error';
    error: string;
};
export interface PluginWorkerChannel {
    postMessage(message: HostToWorkerMessage): void;
    onMessage(handler: (message: WorkerToHostMessage) => void): void;
    onExit(handler: (code: number) => void): void;
    terminate(): Promise<void>;
}
