import type { PluginConfigSchema } from '../../core/plugins/plugin.interfaces';
export declare const SECRET_SENTINEL = "***";
export declare function redactSecretConfig(config: Record<string, unknown> | undefined, schema?: PluginConfigSchema): Record<string, unknown>;
export declare function restoreSecretConfig(incoming: Record<string, unknown>, existing: Record<string, unknown> | undefined, schema?: PluginConfigSchema, options?: {
    mergedOverStored?: boolean;
}): Record<string, unknown>;
