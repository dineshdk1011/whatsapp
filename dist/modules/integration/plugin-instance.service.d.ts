import { Repository } from 'typeorm';
import { PluginInstance } from './entities/plugin-instance.entity';
import type { PluginConfigSchema, PluginManifest } from '../../core/plugins/plugin.interfaces';
import type { PluginInstancePort } from '../../core/plugins/plugin-host-ports';
export declare class InstanceExistsError extends Error {
    constructor(pluginId: string, instanceId: string);
}
export declare class PluginInstanceService implements PluginInstancePort {
    private readonly repo;
    constructor(repo: Repository<PluginInstance>);
    mint(pluginId: string, instanceId: string, opts: {
        sessionScope?: string;
        verifyToken?: string;
        secret?: string;
        config?: Record<string, unknown>;
    }): Promise<PluginInstance>;
    private insert;
    resolve(pluginId: string, instanceId: string): Promise<PluginInstance | null>;
    maskedView(instance: PluginInstance, schema?: PluginConfigSchema): PluginInstance;
    create(pluginId: string, instanceId: string, opts: {
        sessionScope?: string;
        verifyToken?: string;
        secret?: string;
        config?: Record<string, unknown>;
    }): Promise<PluginInstance>;
    list(pluginId: string): Promise<PluginInstance[]>;
    listAll(): Promise<PluginInstance[]>;
    regenerateSecret(pluginId: string, instanceId: string): Promise<PluginInstance | null>;
    update(pluginId: string, instanceId: string, patch: {
        enabled?: boolean;
        sessionScope?: string | null;
        config?: Record<string, unknown>;
    }, schema?: PluginConfigSchema, layer?: {
        net?: PluginManifest['net'];
        beneath?: Record<string, unknown>;
    }): Promise<PluginInstance | null>;
    remove(pluginId: string, instanceId: string): Promise<boolean>;
}
