import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare const CACHE_QUIT_TIMEOUT_MS = 2000;
export declare class CacheService implements OnModuleDestroy {
    private readonly configService;
    private readonly logger;
    private redis;
    private readonly enabled;
    constructor(configService: ConfigService);
    private ensureClient;
    private ping;
    onModuleDestroy(): Promise<void>;
    isAvailable(): Promise<boolean>;
}
