import { OnModuleDestroy } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { ThrottlerStorage } from '@nestjs/throttler';
export declare const THROTTLER_REDIS_QUIT_TIMEOUT_MS = 2000;
interface ThrottlerRecord {
    totalHits: number;
    timeToExpire: number;
    isBlocked: boolean;
    timeToBlockExpire: number;
}
export declare class RedisThrottlerStorage implements ThrottlerStorage, OnModuleDestroy {
    private readonly redis;
    private readonly logger;
    constructor(redis: Redis);
    onModuleDestroy(): Promise<void>;
    increment(key: string, ttl: number, limit: number, blockDuration: number, throttlerName: string): Promise<ThrottlerRecord>;
}
export {};
