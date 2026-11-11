import { EngineRegistry } from '../../engine/engine-registry.service';
import { LidMappingStoreService } from '../../engine/identity/lid-mapping-store.service';
export declare class SessionLidResolver {
    private readonly engines;
    private readonly lidMappingStore?;
    private readonly cache;
    private static readonly CACHE_MAX;
    private readonly retryAfter;
    private static readonly RETRY_AFTER_MS;
    private readonly inFlight;
    private readonly recheckAt;
    private static readonly RECHECK_MS;
    private readonly now;
    constructor(engines: EngineRegistry, lidMappingStore?: LidMappingStoreService | undefined);
    resolveSenderPhone(sessionId: string, contactId: string): Promise<string | null>;
    private lookup;
    private persist;
    private forget;
}
