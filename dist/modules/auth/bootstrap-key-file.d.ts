import type { LoggerService } from '../../common/services/logger.service';
export declare function bootstrapKeyFilePath(): string;
export declare function readBootstrapKey(logger: Pick<LoggerService, 'warn'>): string | null;
export declare function writeBootstrapKey(displayKey: string): void;
export declare function removeBootstrapKey(reason: string, logger: Pick<LoggerService, 'log' | 'warn'>): void;
