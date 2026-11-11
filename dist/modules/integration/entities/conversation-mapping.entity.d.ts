export type HandoverState = 'bot' | 'human' | 'closed';
export declare class ConversationMapping {
    id: string;
    sessionId: string;
    chatId: string;
    pluginId: string;
    instanceId: string;
    providerConversationId: string;
    handoverState: HandoverState;
    metadata: Record<string, unknown> | null;
    updatedAt: Date;
}
