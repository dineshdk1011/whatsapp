import { Request, Response, NextFunction } from 'express';
export declare function parseBodyLimitBytes(limit: string): number;
export declare function resolveInflightBodyBudgetBytes(budgetEnv?: string, bodyLimitEnv?: string): number;
export interface InflightBodyBudgetOptions {
    retryAfterSeconds?: number;
    trustedProxies?: string[];
    perClientShare?: number;
    classify?: (req: Request, clientIp: string) => string | undefined;
    bodyLimitBytes?: number;
    requestTimeoutMs?: number;
}
export interface InflightBodyBudget {
    middleware: (req: Request, res: Response, next: NextFunction) => void;
    currentBytes: () => number;
    clientBytes: (req: Request) => number;
    anonymousBytes: () => number;
}
export declare function createInflightBodyBudget(budgetBytes: number, options?: InflightBodyBudgetOptions): InflightBodyBudget;
