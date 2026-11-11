import { Request, Response, NextFunction } from 'express';
export declare const HTTP_REQUEST_METRICS_CLAIMED: unique symbol;
export declare function claimHttpRequestMetrics(req: Request): void;
export declare function requestMetricsBoundaryMiddleware(req: Request, res: Response, next: NextFunction): void;
