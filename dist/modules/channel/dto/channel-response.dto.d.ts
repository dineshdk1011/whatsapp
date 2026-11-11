export declare class ChannelDto {
    id: string;
    name: string;
    description?: string;
    inviteCode?: string;
    subscriberCount?: number;
    picture?: string;
    verified?: boolean;
    createdAt?: number;
}
export declare class ChannelMessageDto {
    id: string;
    body: string;
    timestamp: number;
    hasMedia: boolean;
    mediaUrl?: string;
}
export declare class ChannelAckResponseDto {
    success: boolean;
}
