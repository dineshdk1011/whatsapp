import type { Request, Response } from 'express';
import { MetricsService } from './metrics.service';
export declare class MetricsController {
    private readonly metricsService;
    constructor(metricsService: MetricsService);
    scrape(req: Request, res: Response): Promise<string>;
}
