export declare class SessionActionResponseDto {
    success: boolean;
}
export declare class SessionGroupSummaryDto {
    id: string;
    name: string;
    linkedParentJID?: string | null;
}
export declare class SessionMemoryUsageDto {
    heapUsed: number;
    heapTotal: number;
    rss: number;
}
export declare class SessionsOverviewResponseDto {
    total: number;
    active: number;
    ready: number;
    disconnected: number;
    byStatus: {
        [status: string]: number;
    };
    memoryUsage: SessionMemoryUsageDto;
}
