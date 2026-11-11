import { ConflictException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository, DataSource } from 'typeorm';
import { Session, SessionStatus } from './entities/session.entity';
import { EngineFactory } from '../../engine/engine.factory';
import { EngineRegistry } from '../../engine/engine-registry.service';
import { IWhatsAppEngine } from '../../engine/interfaces/whatsapp-engine.interface';
import { SessionErrorStore } from './session-error-store.service';
import { SessionRestrictionStore } from './session-restriction-store.service';
import { PresenceStore } from './presence-store.service';
import { type createLogger } from '../../common/services/logger.service';
import { HookManager } from '../../core/hooks';
import { SessionLifecycleFences } from './session-lifecycle-fences';
import { SessionStatusBroadcaster } from './session-status-broadcaster';
import { type ReconnectState } from './session-engine-lifecycle.service';
export declare const SESSION_DELETE_BATCH_SIZE_SQLITE = 2000;
export declare const SESSION_DELETE_BATCH_TARGET_MS_SQLITE = 150;
export declare const SESSION_DELETE_BATCH_MIN_SQLITE = 250;
export declare const SESSION_DELETE_PAUSE_MS_SQLITE = 5;
export declare const SESSION_DELETE_BATCH_SIZE_POSTGRES = 500;
export declare const SESSION_DELETE_READ_AHEAD_POSTGRES = 20;
export declare function nextSqliteDeleteBatchSize(rows: number, tookMs: number): number;
export declare class SessionStoppedException extends ConflictException {
}
export declare class ServerShuttingDownException extends ServiceUnavailableException {
    constructor();
}
export declare class StopMarks extends Set<string> {
    private seq;
    private readonly stamps;
    add(id: string): this;
    delete(id: string): boolean;
    stamp(id: string): number | undefined;
}
export interface StopHooks {
    ownsClaim?: () => boolean;
    afterRead?: () => Promise<void>;
    onReadFailed?: () => void;
    onEngineFound?: () => void;
    recordStop?: () => Promise<void>;
    onRemoving?: () => void;
}
export interface SessionEngineControlsHost {
    sessionRepository: Repository<Session>;
    engineFactory: EngineFactory;
    engines: EngineRegistry;
    sessionErrors: SessionErrorStore;
    sessionRestrictions: SessionRestrictionStore;
    presence: PresenceStore;
    hookManager: HookManager;
    configService?: ConfigService;
    nodeId?: string;
    logger: ReturnType<typeof createLogger>;
    dataSource(): DataSource;
    fences: SessionLifecycleFences;
    broadcaster: SessionStatusBroadcaster;
    cancelReconnect(id: string): void;
    initializeEngine(id: string, session: Session): Promise<void>;
    isSessionRetired(id: string): Promise<boolean>;
    prepareStart(id: string, desiredState: Session['desiredState']): Promise<boolean>;
    purgeAuthDirsIfDeleted(id: string): Promise<void>;
    updateStatus(id: string, status: SessionStatus): Promise<void>;
    ownsSession(id: string): boolean;
    isClosed(): boolean;
    stoppingSessions: StopMarks;
    operatorTeardowns: Map<string, IWhatsAppEngine>;
    reconnectStates: Map<string, ReconnectState>;
    stuckAuthRecoveryUsed: Set<string>;
    initializingSessions: Set<string>;
}
export declare class SessionEngineControls {
    private readonly host;
    private readonly sessionRepository;
    private readonly engineFactory;
    private readonly engines;
    private readonly sessionErrors;
    private readonly sessionRestrictions;
    private readonly presence;
    private readonly hookManager;
    private readonly configService?;
    private readonly logger;
    private readonly fences;
    private readonly broadcaster;
    private readonly stoppingSessions;
    private readonly operatorTeardowns;
    private readonly reconnectStates;
    private readonly stuckAuthRecoveryUsed;
    private readonly initializingSessions;
    private readonly deleting;
    constructor(host: SessionEngineControlsHost);
    isDeleting(id: string): boolean;
    holdDelete(id: string): () => void;
    private requireSession;
    private requireSessionOrDropStopMark;
    start(id: string, { explicit, stoppedSince }?: {
        explicit?: boolean;
        stoppedSince?: () => boolean;
    }): Promise<Session>;
    private reapRetiredEngine;
    retireLaunchedEngine(id: string, engine: IWhatsAppEngine): Promise<void>;
    stop(id: string, hooks?: StopHooks): Promise<Session>;
    logout(id: string, hooks?: StopHooks): Promise<Session>;
    forceKill(id: string, hooks?: StopHooks): Promise<Session>;
    delete(id: string, hooks?: StopHooks): Promise<void>;
    private failUnfinishedBatches;
    private deleteTrafficRowsInBatches;
    private withDeleteClaim;
    private stampedMessageIds;
    private unstampedMessageIds;
    shutdown(): Promise<void>;
    stopOrphanEngines(sessionIds: string[]): Promise<{
        stopped: string[];
        notRunning: string[];
        failed: string[];
    }>;
}
