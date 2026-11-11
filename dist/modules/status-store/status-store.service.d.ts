import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { StatusUpdate } from './entities/status-update.entity';
import type { IncomingStatus } from './incoming-status';
import type { Status } from '../../engine/interfaces/whatsapp-engine.interface';
import { StorageService } from '../../common/storage/storage.service';
import { LidMappingStoreService } from '../../engine/identity/lid-mapping-store.service';
import { SessionWriteScope } from '../../common/utils/session-write-scope';
export declare const STATUS_TTL_MS: number;
export declare const DEFAULT_MEDIA_MAX_BYTES: number;
export declare class StatusStoreService implements OnModuleInit, OnModuleDestroy {
    private readonly repository;
    private readonly storageService;
    private readonly configService;
    private readonly lidMappingStore?;
    private readonly logger;
    private stopMaintenance;
    private readonly orphanFirstSeenAt;
    private purgeCursor?;
    constructor(repository: Repository<StatusUpdate>, storageService: StorageService, configService: ConfigService, lidMappingStore?: LidMappingStoreService | undefined);
    onModuleInit(): void;
    onModuleDestroy(): void;
    ingest(sessionId: string, s: IncomingStatus, lifetime?: SessionWriteScope): Promise<{
        row: StatusUpdate;
        created: boolean;
    }>;
    captureWrites(sessionId: string): SessionWriteScope;
    private applyMediaDecision;
    private attachMedia;
    list(sessionId: string): Promise<Status[]>;
    listByContact(sessionId: string, contactJid: string): Promise<Status[]>;
    private canonicalContactJid;
    private toStatus;
    getMedia(sessionId: string, statusId: string): Promise<{
        path: string;
        mimetype: string;
    } | null>;
    purgeExpired(now: number): Promise<number>;
    sweepOrphanedMedia(now?: number): Promise<number>;
}
