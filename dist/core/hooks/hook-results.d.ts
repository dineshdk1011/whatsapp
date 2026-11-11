import type { HookEvent } from './hook.interfaces';
export declare function isMessagePayload(data: unknown): boolean;
export declare function isWebhookBeforeResult(data: unknown): boolean;
export declare const HOOK_RESULT_ACCEPT: Partial<Record<HookEvent, (data: unknown) => boolean>>;
