import { StorageService } from './storage.service';
export declare function sweepOrphanedFiles(options: {
    storage: Pick<StorageService, 'iterateFiles' | 'deleteFile'>;
    prefix: string;
    graceMs: number;
    now: number;
    firstSeenAt: Map<string, number>;
    referencedAmong: (keys: string[]) => Promise<ReadonlySet<string | undefined>>;
    chunkSize?: number;
    onDeleteFailed: (key: string, error: unknown) => void;
}): Promise<number>;
