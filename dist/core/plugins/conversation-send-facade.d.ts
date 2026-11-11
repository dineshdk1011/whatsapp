import { ConversationSendEnvelope, PluginCapabilityPermission, PluginManifest } from './plugin.interfaces';
export interface ConversationSendDeps {
    manifest: PluginManifest;
    assertPermission: (manifest: PluginManifest, permission: PluginCapabilityPermission) => void;
    assertSessionActive: (sessionId: string) => void;
    resolveChatId: (env: ConversationSendEnvelope) => Promise<string>;
    runGuarded: <T>(events: string[], run: () => Promise<T>) => Promise<T>;
    sendText: (sessionId: string, opts: {
        chatId: string;
        text: string;
        linkPreview?: boolean;
    }) => Promise<unknown>;
    reply: (sessionId: string, opts: {
        chatId: string;
        quotedMessageId: string;
        text: string;
    }) => Promise<unknown>;
    sendMedia: (sessionId: string, opts: {
        chatId: string;
        url: string;
        type: ConversationMediaType;
        caption?: string;
    }) => Promise<unknown>;
    sendLocation: (sessionId: string, opts: {
        chatId: string;
        latitude: number;
        longitude: number;
        description?: string;
    }) => Promise<unknown>;
}
export type ConversationMediaType = 'image' | 'file' | 'audio' | 'video' | 'voice';
export declare function buildConversationSendFacade(deps: ConversationSendDeps): {
    send(env: ConversationSendEnvelope): Promise<unknown>;
};
