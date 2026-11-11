import type { WASocket } from '@whiskeysockets/baileys';
import { Channel } from '../interfaces/whatsapp-engine.interface';
export interface BaileysChannelsHost {
    ensureReady(): void;
    getSocket(): WASocket;
    toEngineJid(jid: string): string;
}
export declare function wmexRefusalCode(error: unknown): number | undefined;
export declare class BaileysChannels {
    private readonly host;
    private readonly queryBudgetMs;
    constructor(host: BaileysChannelsHost, queryBudgetMs?: number);
    private bounded;
    private sock;
    getChannelById(channelId: string): Promise<Channel | null>;
    subscribeToChannel(inviteCode: string): Promise<Channel>;
    private lookup;
    createChannel(name: string, description?: string): Promise<Channel>;
    demoteChannelAdmin(channelId: string, userId: string): Promise<void>;
    transferChannelOwnership(channelId: string, newOwnerId: string): Promise<void>;
    deleteChannel(channelId: string): Promise<void>;
    muteChannel(channelId: string, mute: boolean): Promise<void>;
    unsubscribeFromChannel(channelId: string): Promise<void>;
    private toChannel;
}
