import { ChannelService } from './channel.service';
import { SubscribeChannelDto } from './dto/subscribe-channel.dto';
import { CreateChannelDto } from './dto/create-channel.dto';
import { MuteChannelDto } from './dto/mute-channel.dto';
import { DemoteChannelAdminDto } from './dto/demote-channel-admin.dto';
import { TransferChannelOwnershipDto } from './dto/transfer-channel-ownership.dto';
export declare class ChannelController {
    private readonly channelService;
    constructor(channelService: ChannelService);
    findAll(sessionId: string): Promise<import("../../engine/interfaces/whatsapp-engine.interface").Channel[]>;
    findOne(sessionId: string, channelId: string): Promise<import("../../engine/interfaces/whatsapp-engine.interface").Channel>;
    getMessages(sessionId: string, channelId: string, limit?: string): Promise<import("../../engine/interfaces/whatsapp-engine.interface").ChannelMessage[]>;
    create(sessionId: string, dto: CreateChannelDto): Promise<import("../../engine/interfaces/whatsapp-engine.interface").Channel>;
    remove(sessionId: string, channelId: string): Promise<{
        success: boolean;
    }>;
    mute(sessionId: string, channelId: string, dto: MuteChannelDto): Promise<{
        success: boolean;
    }>;
    demoteAdmin(sessionId: string, channelId: string, dto: DemoteChannelAdminDto): Promise<{
        success: boolean;
    }>;
    transferOwnership(sessionId: string, channelId: string, dto: TransferChannelOwnershipDto): Promise<{
        success: boolean;
    }>;
    subscribe(sessionId: string, body: SubscribeChannelDto): Promise<import("../../engine/interfaces/whatsapp-engine.interface").Channel>;
    unsubscribe(sessionId: string, channelId: string): Promise<{
        success: boolean;
    }>;
}
