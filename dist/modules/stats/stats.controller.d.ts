import { StatsService } from './stats.service';
import { StatsQueryDto } from './dto/stats-query.dto';
export declare class StatsController {
    private readonly statsService;
    constructor(statsService: StatsService);
    getOverview(): Promise<import("./stats.service").OverviewStats>;
    getMessageStats(query: StatsQueryDto): Promise<import("./stats.service").MessageStats>;
    getSessionStats(sessionId: string): Promise<import("./stats.service").SessionStats>;
}
