import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { EngineFactory } from '../../engine/engine.factory';
import { DockerService } from '../docker';
import { CacheService } from '../../common/cache/cache.service';
import { StorageService } from '../../common/storage/storage.service';
import { type UpdateCheck } from './update-check';
interface InfraStatus {
    database: {
        connected: boolean;
        type: string;
        host: string;
        builtIn: boolean;
        running?: boolean;
    };
    redis: {
        enabled: boolean;
        connected: boolean;
        host: string;
        port: number;
        builtIn: boolean;
        running?: boolean;
    };
    queue: {
        enabled: boolean;
        webhooks: {
            pending: number;
            completed: number;
            failed: number;
        };
    };
    storage: {
        type: 'local' | 's3';
        path?: string;
        bucket?: string;
        endpoint?: string;
        builtIn: boolean;
        running?: boolean;
        s3Available?: boolean;
    };
    engine: {
        type: string;
        headless: boolean;
        sessionDataPath: string;
        browserArgs: string;
        webVersion?: string | null;
        webVersionSource?: 'pinned' | 'auto' | 'native';
    };
    envPinned: string[];
}
export declare class InfraStatusController {
    private readonly configService;
    private readonly mainDataSource;
    private readonly dataDataSource;
    private readonly engineFactory;
    private readonly dockerService;
    private readonly cacheService;
    private readonly storageService;
    private readonly webhookQueue?;
    private readonly logger;
    constructor(configService: ConfigService, mainDataSource: DataSource, dataDataSource: DataSource, engineFactory: EngineFactory, dockerService: DockerService, cacheService: CacheService, storageService: StorageService, webhookQueue?: Queue | undefined);
    private static readonly DB_PROBE_TIMEOUT_MS;
    private probeDbConnected;
    getStatus(): Promise<InfraStatus>;
    private readSavedBuiltinFlags;
    getEngines(): Array<{
        id: string;
        name: string;
        enabled: boolean;
        features: string[];
    }>;
    getCurrentEngine(): {
        engineType: string;
    };
    getUpdateCheck(): Promise<UpdateCheck>;
    healthCheck(): {
        status: string;
        timestamp: string;
    };
}
export {};
