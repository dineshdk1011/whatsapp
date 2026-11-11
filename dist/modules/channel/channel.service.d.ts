import { EngineRegistry } from '../../engine/engine-registry.service';
export declare class ChannelService {
    private readonly engines;
    private static readonly MAX_CHANNEL_HISTORY_LIMIT;
    constructor(engines: EngineRegistry);
    private getEngine;
    getSubscribedChannels(sessionId: string): Promise<import("../../engine/interfaces/whatsapp-engine.interface").Channel[]>;
    getChannelById(sessionId: string, channelId: string): Promise<import("../../engine/interfaces/whatsapp-engine.interface").Channel>;
    getChannelMessages(sessionId: string, channelId: string, limit?: number): Promise<import("../../engine/interfaces/whatsapp-engine.interface").ChannelMessage[]>;
    createChannel(sessionId: string, name: string, description?: string): Promise<import("../../engine/interfaces/whatsapp-engine.interface").Channel>;
    private requireChannelId;
    deleteChannel(sessionId: string, channelId: string): Promise<void>;
    muteChannel(sessionId: string, channelId: string, mute: boolean): Promise<void>;
    private addressableUser;
    demoteChannelAdmin(sessionId: string, channelId: string, userId: string): Promise<void>;
    transferChannelOwnership(sessionId: string, channelId: string, newOwnerId: string): Promise<void>;
    subscribeToChannel(sessionId: string, inviteCode: string): Promise<import("../../engine/interfaces/whatsapp-engine.interface").Channel>;
    unsubscribeFromChannel(sessionId: string, channelId: string): Promise<void>;
}
