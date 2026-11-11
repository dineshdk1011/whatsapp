import { OnApplicationBootstrap } from '@nestjs/common';
import { StorageService } from '../../common/storage/storage.service';
import { AuditService } from '../audit/audit.service';
import { ImportStorageDto } from './dto/import-storage.dto';
export declare class InfraStorageController implements OnApplicationBootstrap {
    private readonly storageService;
    private readonly auditService?;
    private readonly logger;
    constructor(storageService: StorageService, auditService?: AuditService | undefined);
    private static readonly EXPORT_ARCHIVE_PATTERN;
    onApplicationBootstrap(): Promise<void>;
    sweepStaleExportArchives(exportDir?: string): Promise<void>;
    private static refusalAsConflict;
    private assertStorageBackendReady;
    getStorageFileCount(): Promise<{
        storageType: string;
        count: number;
        sizeBytes: number;
        sizeMB: string;
    }>;
    exportStorage(): Promise<{
        message: string;
        download: string;
    }>;
    importStorage(body: ImportStorageDto): Promise<{
        imported: boolean;
        count: number;
        failed: number;
        storageType: string;
    }>;
}
