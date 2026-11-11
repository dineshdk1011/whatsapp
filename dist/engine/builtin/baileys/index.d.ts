import { PluginContext, PluginType, IEnginePlugin } from '../../../core/plugins';
import { IWhatsAppEngine } from '../../interfaces/whatsapp-engine.interface';
import { BaileysMessageStore } from '../../types/baileys.types';
import { LidMappingStore } from '../../identity/lid-mapping-store.service';
import { ChatStateStore } from '../../adapters/baileys-chat-state-store.service';
export declare class BaileysPlugin implements IEnginePlugin {
    private readonly messageStore?;
    private readonly registeredConfig?;
    private readonly lidMappingStore?;
    private readonly chatStateStore?;
    type: PluginType.ENGINE;
    private context?;
    constructor(messageStore?: BaileysMessageStore | undefined, registeredConfig?: Record<string, unknown> | undefined, lidMappingStore?: LidMappingStore | undefined, chatStateStore?: ChatStateStore | undefined);
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
export default BaileysPlugin;
