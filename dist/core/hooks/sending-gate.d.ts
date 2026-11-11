import { HookManager } from './hook-manager.service';
export declare function applySendingGate<T extends object>(hookManager: HookManager, sessionId: string, type: string, input: T, source: string): Promise<T>;
