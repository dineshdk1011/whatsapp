import { PluginContext, PluginType, IEnginePlugin } from '../../../core/plugins';
import { IWhatsAppEngine } from '../../interfaces/whatsapp-engine.interface';
import { LidMappingStore } from '../../identity/lid-mapping-store.service';
export declare class WhatsAppWebJsPlugin implements IEnginePlugin {
    private readonly registeredConfig?;
    private readonly lidMappingStore?;
    type: PluginType.ENGINE;
    private context?;
    constructor(registeredConfig?: Record<string, unknown> | undefined, lidMappingStore?: LidMappingStore | undefined);
    onLoad(context: PluginContext): Promise<void>;
    onEnable(context: PluginContext): Promise<void>;
    onDisable(context: PluginContext): Promise<void>;
    createEngine(config: Record<string, unknown>): IWhatsAppEngine;
    getFeatures(): string[];
    getEngineLibrary(): {
        name: string;
        version: string;
    };
    healthCheck(): Promise<{
        healthy: boolean;
        message?: string;
    }>;
}
export default WhatsAppWebJsPlugin;
