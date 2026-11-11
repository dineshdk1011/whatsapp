import { type createLogger } from '../../common/services/logger.service';
export interface EvaluatablePage {
    evaluate<T>(fn: () => T): Promise<T>;
}
export declare function reportMissingCallHook(page: EvaluatablePage | undefined, logger: ReturnType<typeof createLogger>, sessionId: string): Promise<void>;
