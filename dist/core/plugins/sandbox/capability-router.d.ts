import { ConversationSendEnvelope, PluginContext } from '../plugin.interfaces';
import { HandoverState } from '../../../modules/integration/entities/conversation-mapping.entity';
export type CapabilityContext = Pick<PluginContext, 'messages' | 'engine' | 'storage' | 'net'> & {
    conversations: {
        send(env: ConversationSendEnvelope): Promise<unknown>;
    };
    handover: {
        set(key: {
            sessionId: string;
            chatId: string;
            instanceId: string;
        }, state: HandoverState): Promise<unknown>;
    };
    mappings: {
        upsert(key: {
            sessionId: string;
            chatId: string;
            instanceId: string;
        }, providerConversationId: string): Promise<unknown>;
        get(key: {
            sessionId: string;
            chatId: string;
            instanceId: string;
        }): Promise<unknown>;
        getByProvider(instanceId: string, providerConversationId: string): Promise<unknown>;
    };
};
export declare function dispatchCapabilityVerb(context: CapabilityContext, verb: string, args: unknown[]): Promise<unknown>;
