import { OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SessionOwnershipService } from '../session/session-ownership.service';
import { ShutdownService } from '../../common/services/shutdown.service';
import { SessionService } from '../session/session.service';
export declare class SessionTakeoverService implements OnApplicationBootstrap, OnModuleDestroy {
    private readonly sessionService;
    private readonly ownership;
    private readonly configService?;
    private readonly shutdownService?;
    private readonly logger;
    private sweepTimer?;
    private sweepInFlight;
    private shuttingDown;
    constructor(sessionService: SessionService, ownership: SessionOwnershipService, configService?: ConfigService | undefined, shutdownService?: ShutdownService | undefined);
    private get stopping();
    onApplicationBootstrap(): void;
    onModuleDestroy(): void;
    sweep(): Promise<void>;
    private hasStartCapacity;
    private isEligible;
}
