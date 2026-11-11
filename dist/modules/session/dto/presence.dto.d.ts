export declare class SetOwnPresenceDto {
    available: boolean;
}
export declare class SubscribePresenceDto {
    chatId: string;
}
export declare class ParticipantPresenceDto {
    id: string;
    state: string;
    lastSeen?: number;
}
export declare class ChatPresenceResponseDto {
    chatId: string;
    participants: ParticipantPresenceDto[];
    groupOnlineCount?: number;
    observedAt: Date;
}
