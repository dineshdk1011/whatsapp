import { ModuleRef } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { SessionService } from '../session/session.service';
import { LidMappingStoreService } from '../../engine/identity/lid-mapping-store.service';
import { ChatStateStoreService } from '../../engine/adapters/baileys-chat-state-store.service';
import { SessionOwnershipService } from '../session/session-ownership.service';
import type { MigrationTables, TableCounts } from './migration-tables.types';
export interface SessionOwnershipRow {
    id: string;
    nodeId: string | null;
    claimedAt: unknown;
    leaseExpiresAt: unknown;
    nodeUrl: string | null;
}
export declare function restoreSessionOwnership(preserved: SessionOwnershipRow[] | null, insert: (text: string, params: unknown[]) => Promise<unknown>, readAt: Date, now?: Date): Promise<void>;
export declare function sqliteDatetimeColumns(dataSource: DataSource): Map<keyof MigrationTables, string[]>;
export declare function toSqliteDatetime(value: unknown): unknown;
export interface InfraExportDataResult {
    exportedAt: string;
    dataDbType: string;
    tables: MigrationTables;
    counts: TableCounts;
    skippedTables: string[];
    omittedInlineMedia: {
        messages: number;
        messageBatches: number;
    };
}
export interface InfraImportDataResult {
    imported: boolean;
    counts: TableCounts;
    warnings: string[];
    notices: string[];
    restartRequired: boolean;
    orphanedEngines: string[];
    stoppedOrphanEngines: string[];
    failedOrphanEngines: string[];
}
export declare class InfraDataService {
    private readonly configService;
    private readonly dataDataSource;
    private readonly auditService?;
    private readonly sessionService?;
    private readonly lidMappingStore?;
    private readonly ownership?;
    private readonly chatStateStore?;
    private readonly moduleRef?;
    private readonly logger;
    private importInFlight;
    private exportsInFlight;
    constructor(configService: ConfigService, dataDataSource: DataSource, auditService?: AuditService | undefined, sessionService?: SessionService | undefined, lidMappingStore?: LidMappingStoreService | undefined, ownership?: SessionOwnershipService | undefined, chatStateStore?: ChatStateStoreService | undefined, moduleRef?: ModuleRef | undefined);
    private assertExportRegistryMatchesMetadata;
    exportData(): Promise<InfraExportDataResult>;
    private runExport;
    private readInlineMediaTable;
    importData(data: {
        tables: Partial<MigrationTables>;
        force?: boolean;
        stopOrphans?: boolean;
    }): Promise<InfraImportDataResult>;
    private runImport;
}
