import { type createLogger } from '../../common/services/logger.service';
import { type EvaluatablePage } from './wwebjs-call-hook-check';
export declare function reportRunningWebBuild(page: EvaluatablePage | undefined, logger: ReturnType<typeof createLogger>, sessionId: string, pinnedVersion: string | undefined): Promise<void>;
