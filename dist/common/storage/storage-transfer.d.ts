import { Readable, PassThrough } from 'stream';
import { ServiceUnavailableException, StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { LoggerService } from '../services/logger.service';
export declare const DEFAULT_IMPORT_MAX_BYTES: number;
export declare const DEFAULT_IMPORT_MAX_ENTRIES = 100000;
export declare const DEFAULT_IMPORT_MAX_TOTAL_BYTES: number;
export declare function isMissingObjectError(error: unknown): boolean;
export interface ExportFileSource {
    stream: Readable;
    size?: number;
}
export declare const DOWNLOADS_BUSY_RETRY_AFTER_SECONDS = 1;
export declare class DownloadsBusyException extends ServiceUnavailableException {
    constructor();
}
export declare function retryAfterWhenBusy(res: Response): (error: unknown) => never;
export declare function storedFileAttachment(res: Response, source: ExportFileSource, mimetype: string): StreamableFile;
export declare function createExportStream(listFiles: () => Promise<string[]>, openFile: (filePath: string) => Promise<ExportFileSource>, logger: LoggerService): Promise<PassThrough>;
export declare function importFromStream(inputStream: Readable, putFile: (filePath: string, data: Buffer) => Promise<void>, logger: LoggerService): Promise<{
    imported: number;
    failed: number;
}>;
