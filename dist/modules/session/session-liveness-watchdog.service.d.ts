import { EngineRegistry } from '../../engine/engine-registry.service';
import { IWhatsAppEngine } from '../../engine/interfaces/whatsapp-engine.interface';
import { ShutdownService } from '../../common/services/shutdown.service';
export declare class SessionLivenessWatchdog {
    private readonly engines;
    private readonly shutdownService?;
    private readonly logger;
    private readonly failures;
    private timer;
    private onDead;
    constructor(engines: EngineRegistry, shutdownService?: ShutdownService | undefined);
    start(onDead: (id: string, engine: IWhatsAppEngine, reason: string) => Promise<void>, intervalMs?: number): void;
    stop(): void;
    clear(id: string): void;
    tick(): Promise<void>;
    probe(id: string, engine: IWhatsAppEngine): Promise<void>;
}
export declare const SESSION_WATCHDOG_INTERVAL_MS = 60000;
export declare const SESSION_WATCHDOG_PROBE_TIMEOUT_MS = 15000;
export declare const SESSION_WATCHDOG_MAX_FAILURES = 2;
