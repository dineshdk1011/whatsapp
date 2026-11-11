import { Repository } from 'typeorm';
import { ApiKey } from './entities/api-key.entity';
export declare class ApiKeyUsageTracker {
    private readonly apiKeyRepository;
    private readonly logger;
    private static readonly STAT_FLUSH_INTERVAL_MS;
    static readonly SHUTDOWN_FLUSH_TIMEOUT_MS = 5000;
    private readonly pending;
    constructor(apiKeyRepository: Repository<ApiKey>);
    record(apiKey: ApiKey): Promise<void>;
    forget(keyId: string): void;
    flushOnShutdown(): Promise<void>;
    private flushPending;
}
