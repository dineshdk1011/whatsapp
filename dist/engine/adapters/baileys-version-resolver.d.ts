import type * as BaileysLib from '@whiskeysockets/baileys';
import type { LoggerService } from '../../common/services/logger.service';
export type WAVersion = [number, number, number];
export declare const DEFAULT_FALLBACK_WA_VERSION: WAVersion;
export declare const VERSION_RESOLVER_TIMEOUT_MS = 5000;
export interface BaileysVersionResolverOptions {
    authDir: string;
    sessionId: string;
    logger: Pick<LoggerService, 'log' | 'warn'>;
    timeoutMs?: number;
}
export interface ResolveOptions {
    dispatcher?: unknown;
    signal?: AbortSignal;
}
export declare class BaileysVersionResolver {
    private readonly options;
    private readonly cacheFilePath;
    private readonly timeoutMs;
    constructor(options: BaileysVersionResolverOptions);
    resolve(b: typeof BaileysLib, resolveOptions?: ResolveOptions): Promise<WAVersion>;
    private resolveFromEnv;
    private resolveFromWaWeb;
    private resolveFromBaileys;
    private resolveFromDiskCache;
    private saveCachedVersion;
    private isValidVersion;
}
