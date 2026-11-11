import type { LoggerService } from '../../common/services/logger.service';
type HygieneLogger = Pick<LoggerService, 'debug' | 'log'>;
export declare function killOrphanedChromiumProcesses(sessionId: string, logger: HygieneLogger): Promise<void>;
export declare function removeStaleSingletonFiles(sessionId: string, sessionDataPath: string, logger: HygieneLogger): Promise<void>;
export {};
