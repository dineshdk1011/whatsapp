import { MAX_TIMER_MS } from '../common/services/shutdown-budget';
export declare const DEFAULT_DATA_DIR = "./data";
export declare const DEFAULT_PLUGINS_DIR: string;
export declare const LEGACY_PLUGINS_DIR = "./plugins";
export declare function resolveNonNegativeIntEnv(raw: string | undefined, fallback: number): number;
export { MAX_TIMER_MS };
export declare const PINNED_BROWSER_LOCALE = "en-US";
export declare const DEFAULT_PUPPETEER_ARGS: readonly string[];
export declare function withPinnedBrowserLocale(args: readonly string[]): string[];
declare const _default: () => {
    port: number;
    dataDir: string;
    http: {
        requestTimeoutMs: number;
        headersTimeoutMs: number;
        keepAliveTimeoutMs: number;
        inflightBodyBudgetBytes: number;
    };
    search: {
        enabled: boolean;
        provider: string;
        containsEnabled: boolean;
    };
    stats: {
        cacheTtlMs: number;
    };
    features: import("./feature-flags").FeatureFlags;
    sendPacing: import("../modules/message/send-pacing.config").SendPacingConfig;
    redis: {
        host: string;
        port: number;
        username: string | undefined;
        password: string | undefined;
        connectTimeoutMs: number;
    };
    queue: {
        enabled: boolean;
    };
    cache: {
        enabled: boolean;
    };
    database: {
        type: "sqlite";
        database: string;
        synchronize: boolean;
        logging: boolean;
    };
    dataDatabase: {
        type: string;
        database: string;
        name: string;
        schema: string;
        host: string;
        port: number;
        username: string | undefined;
        password: string | undefined;
        synchronize: boolean;
        logging: boolean;
        poolSize: number;
        statementTimeoutMs: number;
        idleTimeoutMs: number;
        connectionTimeoutMs: number;
        ssl: boolean;
        sslRejectUnauthorized: boolean;
    };
    engine: {
        type: string;
        puppeteer: {
            headless: boolean;
            args: string[];
            executablePath: string | undefined;
            protocolTimeoutMs: number | undefined;
        };
        sessionDataPath: string;
        baileys: {
            authDir: string;
        };
    };
    sessions: {
        maxConcurrent: number;
    };
    webhook: {
        timeout: number;
        retryDelay: number;
        dispatchConcurrency: number;
        dispatchMaxQueued: number;
        degradedSessionConcurrency: number | undefined;
        maxPayloadBytes: number;
        maxPerSession: number;
        mediaInlineMaxBytes: number;
        shutdownDrainMs: number;
        failurePayloadRetentionHours: number;
    };
    api: {
        rateLimit: {
            shortTtl: number;
            shortLimit: number;
            mediumTtl: number;
            mediumLimit: number;
            longTtl: number;
            longLimit: number;
        };
    };
    websocket: import("../modules/events/ws-rate-limit").WsRateLimitConfig;
    security: {
        trustedProxies: string[];
    };
    plugins: {
        dir: string;
        legacyDir: string | null;
        catalogUrl: string;
        downloadMaxBytes: number;
        capTimeoutMs: number;
        storageMaxBytes: number;
    };
    ingress: {
        allowUnsigned: boolean;
    };
    status: {
        mediaMaxBytes: number;
        orphanSweepIntervalMs: number;
        orphanGraceMs: number;
    };
    chatMedia: {
        archiveEnabled: boolean;
        archiveOutbound: boolean;
        maxBytes: number;
        ttlDays: number;
        orphanSweepIntervalMs: number;
        orphanGraceMs: number;
        inlineMode: "archive" | "inline";
    };
    session: {
        nodeId: string;
        nodeUrl: string;
        proxyTimeoutMs: number;
        leaseTtlMs: number;
        leaseHeartbeatMs: number;
        takeoverSweepMs: number;
    };
    automation: {
        maxPerSession: number;
    };
    mediaConversion: {
        enabled: boolean;
        ffmpegPath: string;
        timeoutMs: number;
        maxOutputBytes: number;
        concurrency: number;
    };
    template: {
        renderMaxChars: number;
    };
    storage: {
        type: string;
        localPath: string;
        s3: {
            bucket: string | undefined;
            region: string | undefined;
            accessKeyId: string | undefined;
            secretAccessKey: string | undefined;
            endpoint: string | undefined;
            keyPrefix: string | undefined;
        };
    };
};
export default _default;
