import type { PluginManifest } from './plugin.interfaces';
export declare const sessionScopeKey: (scope: string | null | undefined) => string;
export declare const isAllSessionsScope: (scope: string | null | undefined) => boolean;
export declare function isPluginActiveForSession(sessionScoped: boolean, activeSessions: string[], sessionId: string | undefined): boolean;
export type ConfigLayerManifest = Pick<PluginManifest, 'net' | 'configSchema'>;
export declare function restorableConfig(stored: Record<string, unknown> | undefined, incoming: Record<string, unknown> | null | undefined, manifest: ConfigLayerManifest, beneath?: Record<string, unknown>): Record<string, unknown> | undefined;
export declare function resolveInstanceConfig(resolved: Record<string, unknown>, instanceConfig: Record<string, unknown> | null | undefined, manifest: ConfigLayerManifest, base?: Record<string, unknown>): Record<string, unknown>;
export declare function resolvePluginConfig(base: Record<string, unknown>, sessionConfig: Record<string, Record<string, unknown>> | undefined, sessionId: string | undefined, sessionScoped: boolean, manifest: ConfigLayerManifest): Record<string, unknown>;
