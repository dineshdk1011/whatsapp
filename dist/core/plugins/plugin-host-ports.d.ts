import type { IWhatsAppEngine } from '../../engine/interfaces/whatsapp-engine.interface';
import type { MessageResponseDto } from '../../modules/message/dto';
import type { HandoverState } from '../../modules/integration/entities/conversation-mapping.entity';
export interface PluginMessagePort {
    sendText(sessionId: string, dto: {
        chatId: string;
        text: string;
        linkPreview?: boolean;
    }): Promise<MessageResponseDto>;
    reply(sessionId: string, dto: {
        chatId: string;
        quotedMessageId: string;
        text: string;
    }): Promise<MessageResponseDto>;
    sendImage(sessionId: string, dto: {
        chatId: string;
        url?: string;
        caption?: string;
    }): Promise<MessageResponseDto>;
    sendVideo(sessionId: string, dto: {
        chatId: string;
        url?: string;
        caption?: string;
    }): Promise<MessageResponseDto>;
    sendDocument(sessionId: string, dto: {
        chatId: string;
        url?: string;
        caption?: string;
    }): Promise<MessageResponseDto>;
    sendAudio(sessionId: string, dto: {
        chatId: string;
        url?: string;
        caption?: string;
        ptt?: boolean;
    }): Promise<MessageResponseDto>;
    sendLocation(sessionId: string, dto: {
        chatId: string;
        latitude: number;
        longitude: number;
        description?: string;
    }): Promise<MessageResponseDto>;
}
export interface PluginSessionPort {
    getEngine(sessionId: string): IWhatsAppEngine | undefined;
    findOne(sessionId: string): Promise<unknown>;
}
export interface PluginMappingKey {
    sessionId: string;
    chatId: string;
    pluginId: string;
    instanceId: string;
}
export interface PluginConversationMappingRow {
    id: string;
    sessionId: string;
    chatId: string;
    pluginId: string;
    instanceId: string;
    providerConversationId: string;
    handoverState: HandoverState;
}
export interface PluginConversationMappingPort {
    get(key: PluginMappingKey): Promise<PluginConversationMappingRow | null>;
    getByProvider(pluginId: string, instanceId: string, providerConversationId: string): Promise<PluginConversationMappingRow | null>;
    upsert(key: PluginMappingKey, providerConversationId: string): Promise<void>;
    delete(id: string): Promise<void>;
    setHandover(id: string, state: HandoverState): Promise<void>;
    rebindSession(id: string, sessionId: string): Promise<void>;
    findHandoverForChat(sessionId: string, chatId: string): Promise<{
        pluginId: string;
        handoverState: HandoverState;
    } | null>;
    releaseTakeovers(pluginId: string): Promise<void>;
}
export interface PluginInstanceRecord {
    enabled: boolean;
    config?: Record<string, unknown> | null;
    sessionScope?: string | null;
}
export interface PluginInstancePort {
    list(pluginId: string): Promise<PluginInstanceRecord[]>;
    resolve(pluginId: string, instanceId: string): Promise<PluginInstanceRecord | null>;
}
export interface PluginSearchRegistryPort {
    register(provider: {
        id: string;
    }): void;
    unregister(id: string): void;
    setActive(id: string): void;
}
export declare const PLUGIN_MESSAGE_PORT: unique symbol;
export declare const PLUGIN_SESSION_PORT: unique symbol;
export declare const PLUGIN_CONVERSATION_MAPPING_PORT: unique symbol;
export declare const PLUGIN_INSTANCE_PORT: unique symbol;
export declare const PLUGIN_SEARCH_REGISTRY_PORT: unique symbol;
