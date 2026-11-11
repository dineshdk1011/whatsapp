import { Repository } from 'typeorm';
import { ConversationMapping, HandoverState } from './entities/conversation-mapping.entity';
import { LidMappingStoreService } from '../../engine/identity/lid-mapping-store.service';
import type { PluginConversationMappingPort } from '../../core/plugins/plugin-host-ports';
export interface MappingKey {
    sessionId: string;
    chatId: string;
    pluginId: string;
    instanceId: string;
}
export declare class ConversationMappingConflict extends Error {
    readonly key: MappingKey;
    readonly providerConversationId: string;
    constructor(key: MappingKey, providerConversationId: string);
}
export declare class ConversationMappingService implements PluginConversationMappingPort {
    private readonly repo;
    private readonly lidMappingStore?;
    constructor(repo: Repository<ConversationMapping>, lidMappingStore?: LidMappingStoreService | undefined);
    upsert(key: MappingKey, providerConversationId: string, patch?: Partial<ConversationMapping>): Promise<void>;
    private updateById;
    releaseTakeovers(pluginId: string): Promise<void>;
    get(key: MappingKey): Promise<ConversationMapping | null>;
    findHandoverForChat(sessionId: string, chatId: string): Promise<{
        pluginId: string;
        handoverState: HandoverState;
    } | null>;
    private inheritedHandover;
    private chatIdAliases;
    getByProvider(pluginId: string, instanceId: string, providerConversationId: string): Promise<ConversationMapping | null>;
    setHandover(id: string, state: HandoverState): Promise<void>;
    delete(id: string): Promise<void>;
    rebindSession(id: string, sessionId: string): Promise<void>;
}
