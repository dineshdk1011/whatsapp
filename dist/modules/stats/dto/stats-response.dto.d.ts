export declare class OverviewSessionsDto {
    active: number;
    total: number;
    byStatus: {
        [status: string]: number;
    };
}
export declare class OverviewTodayDto {
    sent: number;
    received: number;
}
export declare class OverviewMessagesDto {
    sent: number;
    received: number;
    failed: number;
    today: OverviewTodayDto;
}
export declare class OverviewStatsResponseDto {
    sessions: OverviewSessionsDto;
    messages: OverviewMessagesDto;
}
export declare class TimeSeriesPointDto {
    timestamp: string;
    sent: number;
    received: number;
}
export declare class StatsBySessionDto {
    sessionId: string;
    name: string;
    sent: number;
    received: number;
}
export declare class StatsTopChatDto {
    chatId: string;
    chatName: string | null;
    messageCount: number;
}
export declare class MessageStatsResponseDto {
    timeSeries: TimeSeriesPointDto[];
    byType: {
        [messageType: string]: number;
    };
    bySession: StatsBySessionDto[];
    topChats: StatsTopChatDto[];
}
export declare class SessionStatsSessionDto {
    id: string;
    name: string;
    status: string;
}
export declare class SessionStatsMessagesDto {
    sent: number;
    received: number;
    today: number;
    failed: number;
}
export declare class SessionStatsTopChatDto {
    chatId: string;
    chatName: string | null;
    count: number;
    lastActive: string;
}
export declare class SessionHourlyActivityDto {
    hour: number;
    sent: number;
    received: number;
}
export declare class SessionStatsResponseDto {
    session: SessionStatsSessionDto;
    messages: SessionStatsMessagesDto;
    topChats: SessionStatsTopChatDto[];
    hourlyActivity: SessionHourlyActivityDto[];
}
