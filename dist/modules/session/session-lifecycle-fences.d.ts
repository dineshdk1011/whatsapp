import { EngineRegistry } from '../../engine/engine-registry.service';
import { IWhatsAppEngine } from '../../engine/interfaces/whatsapp-engine.interface';
import { type createLogger } from '../../common/services/logger.service';
export declare const ENGINE_TEARDOWN_TIMEOUT_MS = 10000;
export declare class SessionLifecycleFences {
    private readonly engines;
    private readonly pendingTeardowns;
    private readonly pendingInitialStatuses;
    private readonly logger;
    constructor(deps: {
        engines: EngineRegistry;
        pendingTeardowns: Map<string, Promise<void>>;
        pendingInitialStatuses: Map<string, {
            engine: IWhatsAppEngine;
            promise: Promise<void>;
        }>;
        logger: ReturnType<typeof createLogger>;
    });
    destroyEngineSafely(sessionId: string, engine: IWhatsAppEngine): Promise<boolean>;
    destroyWithEscalation(sessionId: string, engine: IWhatsAppEngine): Promise<boolean>;
    teardownEngineSafely(sessionId: string, engine: IWhatsAppEngine, teardown: (e: IWhatsAppEngine) => Promise<void>, label: 'destroy' | 'disconnect' | 'force-destroy' | 'logout', sessionName?: string): Promise<boolean>;
    trackPendingCredentialTeardown(sessionName: string, raw: Promise<void>): void;
    awaitPendingTeardown(sessionName: string): Promise<void>;
    awaitInitialStatus(id: string, engine: IWhatsAppEngine): Promise<void>;
    evictAndForceDestroy(id: string, engine: IWhatsAppEngine): void;
}
