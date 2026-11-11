import { HookEvent, HookHandler } from './hook.interfaces';
export declare function normalizeHookPriority(priority: unknown): number;
export interface HookExecuteOptions<T> {
    sessionId?: string;
    source: string;
    accept?: (data: T) => boolean;
}
export declare class HookManager {
    private readonly logger;
    private readonly hooks;
    private readonly pluginHooks;
    private readonly inFlightEvents;
    private nextHookId;
    register(pluginId: string, event: HookEvent, handler: HookHandler, priority?: number): string;
    unregister(hookId: string): void;
    setPriority(hookId: string, priority: number): void;
    unregisterPlugin(pluginId: string): void;
    execute<T>(event: HookEvent, data: T, options: HookExecuteOptions<T>): Promise<{
        continue: boolean;
        data: T;
    }>;
    runInFlight<T>(events: Iterable<HookEvent>, fn: () => T): T;
    isInFlight(event: HookEvent): boolean;
    currentInFlight(): HookEvent[];
    private runHandlers;
    hasHooks(event: HookEvent): boolean;
    getHookCount(event: HookEvent): number;
    getRegisteredHooks(): Record<HookEvent, {
        pluginId: string;
        priority: number;
    }[]>;
    getPluginEvents(pluginId: string): HookEvent[];
}
