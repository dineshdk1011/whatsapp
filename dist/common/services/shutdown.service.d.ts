import { ConfigService } from '@nestjs/config';
export declare class ShutdownService {
    private readonly config?;
    private readonly logger;
    private destroyCallback;
    private readonly shutdownListeners;
    private shuttingDown;
    private shutdownScheduled;
    private tearingDown;
    constructor(config?: ConfigService | undefined);
    setShutdownCallback(callback: () => Promise<void>): void;
    onShutdown(listener: () => void): void;
    isShuttingDown(): boolean;
    isTearingDown(): boolean;
    markShuttingDown(): void;
    shutdown(delayMs?: number): void;
    private resolveDelay;
}
