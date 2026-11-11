"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_PUPPETEER_ARGS = exports.PINNED_BROWSER_LOCALE = exports.MAX_TIMER_MS = exports.LEGACY_PLUGINS_DIR = exports.DEFAULT_PLUGINS_DIR = exports.DEFAULT_DATA_DIR = void 0;
exports.resolveNonNegativeIntEnv = resolveNonNegativeIntEnv;
exports.withPinnedBrowserLocale = withPinnedBrowserLocale;
const path = __importStar(require("path"));
const feature_flags_1 = require("./feature-flags");
const send_pacing_config_1 = require("../modules/message/send-pacing.config");
const inflight_body_budget_1 = require("./inflight-body-budget");
const http_timeouts_1 = require("./http-timeouts");
const ws_rate_limit_1 = require("../modules/events/ws-rate-limit");
const shutdown_budget_1 = require("../common/services/shutdown-budget");
Object.defineProperty(exports, "MAX_TIMER_MS", { enumerable: true, get: function () { return shutdown_budget_1.MAX_TIMER_MS; } });
const ip_1 = require("../common/utils/ip");
const env_int_1 = require("../common/utils/env-int");
exports.DEFAULT_DATA_DIR = './data';
exports.DEFAULT_PLUGINS_DIR = path.join(exports.DEFAULT_DATA_DIR, 'plugins');
exports.LEGACY_PLUGINS_DIR = './plugins';
function resolveNonNegativeIntEnv(raw, fallback) {
    const trimmed = raw?.trim();
    if (!trimmed || !/^\d+$/.test(trimmed))
        return fallback;
    return Number(trimmed);
}
exports.PINNED_BROWSER_LOCALE = 'en-US';
exports.DEFAULT_PUPPETEER_ARGS = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
];
function withPinnedBrowserLocale(args) {
    return args.some(arg => arg.startsWith('--lang')) ? [...args] : [...args, `--lang=${exports.PINNED_BROWSER_LOCALE}`];
}
exports.default = () => ({
    port: parseInt(process.env.PORT || '2785', 10),
    dataDir: process.env.PLUGIN_STATE_DIR || exports.DEFAULT_DATA_DIR,
    http: {
        requestTimeoutMs: (0, http_timeouts_1.resolveRequestTimeoutMs)(process.env.REQUEST_TIMEOUT_MS),
        headersTimeoutMs: parseInt(process.env.HEADERS_TIMEOUT_MS || '65000', 10),
        keepAliveTimeoutMs: parseInt(process.env.KEEPALIVE_TIMEOUT_MS || '5000', 10),
        inflightBodyBudgetBytes: (0, inflight_body_budget_1.resolveInflightBodyBudgetBytes)(process.env.INFLIGHT_BODY_BUDGET_BYTES, process.env.BODY_SIZE_LIMIT),
    },
    search: {
        enabled: process.env.SEARCH_ENABLED !== 'false',
        provider: process.env.SEARCH_PROVIDER || 'auto',
        containsEnabled: process.env.SEARCH_CONTAINS_ENABLED === 'true',
    },
    stats: {
        cacheTtlMs: parseInt(process.env.STATS_CACHE_TTL_MS || '30000', 10),
    },
    features: (0, feature_flags_1.computeFeatureFlags)(),
    sendPacing: (0, send_pacing_config_1.computeSendPacingConfig)(),
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        username: process.env.REDIS_USERNAME,
        password: process.env.REDIS_PASSWORD,
        connectTimeoutMs: parseInt(process.env.REDIS_CONNECT_TIMEOUT_MS || '5000', 10),
    },
    queue: {
        enabled: process.env.QUEUE_ENABLED === 'true',
    },
    cache: {
        enabled: process.env.CACHE_ENABLED === 'true',
    },
    database: {
        type: 'sqlite',
        database: process.env.MAIN_DATABASE_NAME || './data/main.sqlite',
        synchronize: process.env.MAIN_DATABASE_SYNCHRONIZE === 'true',
        logging: process.env.DATABASE_LOGGING === 'true',
    },
    dataDatabase: {
        type: process.env.DATABASE_TYPE || 'sqlite',
        database: process.env.DATABASE_NAME || './data/openwa.sqlite',
        name: process.env.DATABASE_NAME || 'openwa',
        schema: process.env.POSTGRES_SCHEMA || 'public',
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '5432', 10),
        username: process.env.DATABASE_USERNAME,
        password: process.env.DATABASE_PASSWORD,
        synchronize: process.env.DATABASE_SYNCHRONIZE === 'true',
        logging: process.env.DATABASE_LOGGING === 'true',
        poolSize: parseInt(process.env.DATABASE_POOL_SIZE || '10', 10),
        statementTimeoutMs: parseInt(process.env.DATABASE_STATEMENT_TIMEOUT_MS || '30000', 10),
        idleTimeoutMs: parseInt(process.env.DATABASE_IDLE_TIMEOUT_MS || '30000', 10),
        connectionTimeoutMs: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT_MS || '10000', 10),
        ssl: process.env.DATABASE_SSL === 'true',
        sslRejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false',
    },
    engine: {
        type: process.env.ENGINE_TYPE || 'whatsapp-web.js',
        puppeteer: {
            headless: process.env.PUPPETEER_HEADLESS !== 'false',
            args: withPinnedBrowserLocale((process.env.PUPPETEER_ARGS || exports.DEFAULT_PUPPETEER_ARGS.join(','))
                .split(/\s+|,+(?=-)/)
                .map(arg => arg.replace(/^,+|,+$/g, ''))
                .filter(Boolean)),
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
            protocolTimeoutMs: (() => {
                const n = parseInt(process.env.PUPPETEER_PROTOCOL_TIMEOUT_MS || '', 10);
                return Number.isFinite(n) && n > 0 && n <= shutdown_budget_1.MAX_TIMER_MS ? n : undefined;
            })(),
        },
        sessionDataPath: process.env.SESSION_DATA_PATH || './data/sessions',
        baileys: {
            authDir: process.env.BAILEYS_AUTH_DIR || './data/baileys',
        },
    },
    sessions: {
        maxConcurrent: parseInt(process.env.MAX_CONCURRENT_SESSIONS || '0', 10),
    },
    webhook: {
        timeout: parseInt(process.env.WEBHOOK_TIMEOUT || '10000', 10),
        retryDelay: parseInt(process.env.WEBHOOK_RETRY_DELAY || '5000', 10),
        dispatchConcurrency: parseInt(process.env.WEBHOOK_DISPATCH_CONCURRENCY || '16', 10),
        dispatchMaxQueued: parseInt(process.env.WEBHOOK_DISPATCH_MAX_QUEUED || '1000', 10),
        degradedSessionConcurrency: (() => {
            const n = parseInt(process.env.WEBHOOK_DEGRADED_SESSION_CONCURRENCY ?? '', 10);
            return Number.isInteger(n) && n > 0 ? n : undefined;
        })(),
        maxPayloadBytes: (0, env_int_1.positiveIntFromEnv)('WEBHOOK_MAX_PAYLOAD_BYTES', 1024 * 1024),
        maxPerSession: resolveNonNegativeIntEnv(process.env.WEBHOOK_MAX_PER_SESSION, 16),
        mediaInlineMaxBytes: resolveNonNegativeIntEnv(process.env.WEBHOOK_MEDIA_INLINE_MAX_BYTES, 1024 * 1024),
        shutdownDrainMs: resolveNonNegativeIntEnv(process.env.WEBHOOK_SHUTDOWN_DRAIN_MS, shutdown_budget_1.DEFAULT_WEBHOOK_SHUTDOWN_DRAIN_MS),
        failurePayloadRetentionHours: resolveNonNegativeIntEnv(process.env.WEBHOOK_FAILURE_PAYLOAD_RETENTION_HOURS, 0),
    },
    api: {
        rateLimit: {
            shortTtl: parseInt(process.env.RATE_LIMIT_SHORT_TTL || '1000', 10),
            shortLimit: parseInt(process.env.RATE_LIMIT_SHORT_LIMIT || '10', 10),
            mediumTtl: parseInt(process.env.RATE_LIMIT_MEDIUM_TTL || '60000', 10),
            mediumLimit: parseInt(process.env.RATE_LIMIT_MEDIUM_LIMIT || '100', 10),
            longTtl: parseInt(process.env.RATE_LIMIT_LONG_TTL || '3600000', 10),
            longLimit: parseInt(process.env.RATE_LIMIT_LONG_LIMIT || '1000', 10),
        },
    },
    websocket: (0, ws_rate_limit_1.readWsRateLimitConfig)(),
    security: {
        trustedProxies: (0, ip_1.parseTrustedProxies)(process.env.TRUSTED_PROXIES),
    },
    plugins: {
        dir: process.env.PLUGINS_DIR || exports.DEFAULT_PLUGINS_DIR,
        legacyDir: process.env.PLUGINS_DIR ? null : exports.LEGACY_PLUGINS_DIR,
        catalogUrl: process.env.PLUGIN_CATALOG_URL || 'https://raw.githubusercontent.com/rmyndharis/OpenWA-plugins/main/plugins.json',
        downloadMaxBytes: (() => {
            const n = parseInt(process.env.PLUGIN_DOWNLOAD_MAX_BYTES ?? '', 10);
            return Number.isFinite(n) && n > 0 ? n : 5 * 1024 * 1024;
        })(),
        capTimeoutMs: (() => {
            const n = parseInt(process.env.PLUGIN_CAP_TIMEOUT_MS ?? '', 10);
            return Number.isFinite(n) && n > 0 ? n : 30000;
        })(),
        storageMaxBytes: (() => {
            const n = parseInt(process.env.PLUGIN_STORAGE_MAX_BYTES ?? '', 10);
            return Number.isFinite(n) && n > 0 ? n : 50 * 1024 * 1024;
        })(),
    },
    ingress: {
        allowUnsigned: process.env.ALLOW_UNSIGNED_INGRESS === 'true',
    },
    status: {
        mediaMaxBytes: (() => {
            const n = parseInt(process.env.STATUS_MEDIA_MAX_BYTES ?? '', 10);
            return Number.isFinite(n) && n > 0 ? n : 10 * 1024 * 1024;
        })(),
        orphanSweepIntervalMs: (() => {
            const n = parseInt(process.env.STATUS_ORPHAN_SWEEP_INTERVAL_MS ?? '', 10);
            return Number.isFinite(n) && n > 0 ? n : 60 * 60 * 1000;
        })(),
        orphanGraceMs: (() => {
            const n = parseInt(process.env.STATUS_ORPHAN_GRACE_MS ?? '', 10);
            return Number.isFinite(n) && n > 0 ? n : 60 * 60 * 1000;
        })(),
    },
    chatMedia: {
        archiveEnabled: process.env.CHAT_MEDIA_ARCHIVE_ENABLED === 'true',
        archiveOutbound: process.env.CHAT_MEDIA_ARCHIVE_OUTBOUND === 'true',
        maxBytes: (() => {
            const n = parseInt(process.env.CHAT_MEDIA_ARCHIVE_MAX_BYTES ?? '', 10);
            return Number.isFinite(n) && n > 0 ? n : 25 * 1024 * 1024;
        })(),
        ttlDays: (() => {
            const n = parseInt(process.env.CHAT_MEDIA_ARCHIVE_TTL_DAYS ?? '', 10);
            return Number.isFinite(n) && n >= 0 ? n : 0;
        })(),
        orphanSweepIntervalMs: (() => {
            const n = parseInt(process.env.CHAT_MEDIA_ORPHAN_SWEEP_INTERVAL_MS ?? '', 10);
            return Number.isFinite(n) && n > 0 ? n : 60 * 60 * 1000;
        })(),
        orphanGraceMs: (() => {
            const n = parseInt(process.env.CHAT_MEDIA_ORPHAN_GRACE_MS ?? '', 10);
            return Number.isFinite(n) && n > 0 ? n : 60 * 60 * 1000;
        })(),
        inlineMode: process.env.MESSAGE_INLINE_MEDIA === 'archive' ? 'archive' : 'inline',
    },
    session: {
        nodeId: process.env.NODE_ID || '',
        nodeUrl: process.env.NODE_URL || '',
        proxyTimeoutMs: (() => {
            const n = parseInt(process.env.SESSION_PROXY_TIMEOUT_MS ?? '', 10);
            return Number.isFinite(n) && n > 0 ? n : 60_000;
        })(),
        leaseTtlMs: (() => {
            const n = parseInt(process.env.SESSION_LEASE_TTL_MS ?? '', 10);
            return Number.isFinite(n) && n > 0 ? n : 60_000;
        })(),
        leaseHeartbeatMs: (() => {
            const n = parseInt(process.env.SESSION_LEASE_HEARTBEAT_MS ?? '', 10);
            return Number.isFinite(n) && n > 0 ? n : 20_000;
        })(),
        takeoverSweepMs: (() => {
            const n = parseInt(process.env.SESSION_TAKEOVER_SWEEP_MS ?? '', 10);
            return Number.isFinite(n) && n > 0 ? n : 30_000;
        })(),
    },
    automation: {
        maxPerSession: (() => {
            const n = parseInt(process.env.AUTOMATION_MAX_PER_SESSION ?? '', 10);
            return Number.isFinite(n) && n >= 0 ? n : 32;
        })(),
    },
    mediaConversion: {
        enabled: process.env.MEDIA_CONVERSION_ENABLED === 'true',
        ffmpegPath: process.env.FFMPEG_PATH || 'ffmpeg',
        timeoutMs: (() => {
            const n = parseInt(process.env.MEDIA_CONVERSION_TIMEOUT_MS ?? '', 10);
            return Number.isFinite(n) && n > 0 ? n : 60_000;
        })(),
        maxOutputBytes: (() => {
            const n = parseInt(process.env.MEDIA_CONVERSION_MAX_OUTPUT_BYTES ?? '', 10);
            return Number.isFinite(n) && n > 0 ? n : 50 * 1024 * 1024;
        })(),
        concurrency: (() => {
            const n = parseInt(process.env.MEDIA_CONVERSION_CONCURRENCY ?? '', 10);
            return Number.isFinite(n) && n > 0 ? n : 2;
        })(),
    },
    template: {
        renderMaxChars: (() => {
            const n = parseInt(process.env.TEMPLATE_RENDER_MAX_CHARS ?? '', 10);
            return Number.isFinite(n) && n > 0 ? n : 64 * 1024;
        })(),
    },
    storage: {
        type: process.env.STORAGE_TYPE || 'local',
        localPath: process.env.STORAGE_LOCAL_PATH || './data/media',
        s3: {
            bucket: process.env.S3_BUCKET,
            region: process.env.S3_REGION,
            accessKeyId: process.env.S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
            endpoint: process.env.S3_ENDPOINT,
            keyPrefix: process.env.S3_KEY_PREFIX,
        },
    },
});
//# sourceMappingURL=configuration.js.map