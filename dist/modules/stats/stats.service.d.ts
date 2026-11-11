import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Session } from '../session/entities/session.entity';
import { Message } from '../message/entities/message.entity';
export declare function timeSeriesTimestampSql(dbType: string, interval: 'hour' | 'day'): string;
export declare function hourBucketSql(dbType: string): string;
export declare function maxCreatedAtSql(dbType: string): string;
export interface OverviewStats {
    sessions: {
        active: number;
        total: number;
        byStatus: Record<string, number>;
    };
    messages: {
        sent: number;
        received: number;
        failed: number;
        today: {
            sent: number;
            received: number;
        };
    };
}
export interface TimeSeriesPoint {
    timestamp: string;
    sent: number;
    received: number;
}
export interface MessageStats {
    timeSeries: TimeSeriesPoint[];
    byType: Record<string, number>;
    bySession: Array<{
        sessionId: string;
        name: string;
        sent: number;
        received: number;
    }>;
    topChats: Array<{
        chatId: string;
        chatName: string | null;
        messageCount: number;
    }>;
}
export interface SessionStats {
    session: {
        id: string;
        name: string;
        status: string;
    };
    messages: {
        sent: number;
        received: number;
        today: number;
        failed: number;
    };
    topChats: Array<{
        chatId: string;
        chatName: string | null;
        count: number;
        lastActive: string;
    }>;
    hourlyActivity: Array<{
        hour: number;
        sent: number;
        received: number;
    }>;
}
export declare class StatsService {
    private readonly sessionRepo;
    private readonly messageRepo;
    private readonly configService;
    private readonly memo;
    private readonly inflight;
    constructor(sessionRepo: Repository<Session>, messageRepo: Repository<Message>, configService: ConfigService);
    private get dataDbType();
    private get memoTtlMs();
    private memoized;
    getOverview(): Promise<OverviewStats>;
    private loadOverview;
    getMessageStats(period: '24h' | '7d' | '30d'): Promise<MessageStats>;
    private loadMessageStats;
    private getTopChats;
    getSessionStats(sessionId: string): Promise<SessionStats>;
    private loadSessionStats;
    private getPeriodStart;
    private getTimeSeries;
    private getHourlyActivity;
}
