import { Readable } from 'stream';
import type { LoggerService } from '../services/logger.service';
export declare class StorageWalkRefusedError extends Error {
    constructor(message: string, options?: {
        cause?: unknown;
    });
}
export interface LocalWalkOptions {
    skipUnreadable?: boolean;
    logger?: Pick<LoggerService, 'log' | 'warn'>;
}
export declare function iterateLocalFiles(localPath: string, prefix?: string, options?: LocalWalkOptions): AsyncGenerator<string>;
export declare function getLocalFile(localPath: string, filePath: string): Promise<Buffer>;
export declare function openLocalFile(localPath: string, filePath: string): Promise<{
    stream: Readable;
    size: number;
}>;
export declare function putLocalFile(localPath: string, filePath: string, data: Buffer): Promise<void>;
export declare function deleteLocalFile(localPath: string, filePath: string): Promise<void>;
