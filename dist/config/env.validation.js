"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sqliteDataMainPathCollision = sqliteDataMainPathCollision;
exports.postgresSchemaError = postgresSchemaError;
exports.builtinRedisTlsError = builtinRedisTlsError;
exports.builtinRedisUsernameError = builtinRedisUsernameError;
exports.s3EndpointError = s3EndpointError;
exports.validateEnv = validateEnv;
const path_1 = require("path");
const s3_key_prefix_1 = require("../common/storage/s3-key-prefix");
const bundled_host_1 = require("../modules/docker/bundled-host");
const bootstrap_security_1 = require("./bootstrap-security");
const inflight_body_budget_1 = require("./inflight-body-budget");
const MAIN_DB_DEFAULT_PATH = './data/main.sqlite';
const DATA_DB_DEFAULT_PATH = './data/openwa.sqlite';
const MAX_TIMER_MS = 2147483647;
function sqliteDataMainPathCollision(config) {
    const read = (key) => {
        const value = config[key];
        return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
    };
    const dbType = read('DATABASE_TYPE');
    if (dbType !== undefined && dbType !== 'sqlite')
        return null;
    const dataDbName = read('DATABASE_NAME') || DATA_DB_DEFAULT_PATH;
    const mainDbPath = read('MAIN_DATABASE_NAME') || MAIN_DB_DEFAULT_PATH;
    if ((0, path_1.resolve)(dataDbName) === (0, path_1.resolve)(mainDbPath)) {
        return `DATABASE_NAME (${dataDbName}) must not point at the main database file (${mainDbPath}); use a separate file`;
    }
    return null;
}
function postgresSchemaError(schema) {
    if (!/^[a-z_][a-z0-9_]{0,62}$/.test(schema)) {
        return `POSTGRES_SCHEMA must be a valid lower-case Postgres identifier (a lower-case letter or underscore, then lower-case letters/digits/underscores, max 63 chars; got ${JSON.stringify(schema)})`;
    }
    if (schema.startsWith('pg_')) {
        return `POSTGRES_SCHEMA must not use the reserved "pg_" prefix (got ${JSON.stringify(schema)})`;
    }
    return null;
}
const REDIS_CONSUMER_FLAGS = ['REDIS_ENABLED', 'QUEUE_ENABLED', 'CACHE_ENABLED'];
const EXTERNAL_REDIS_WAY_OUT = 'or use an external Redis (REDIS_BUILTIN=false with its REDIS_HOST, also on the Infrastructure page)';
function usesBundledRedis(config) {
    const host = typeof config.REDIS_HOST === 'string' ? config.REDIS_HOST : undefined;
    return (REDIS_CONSUMER_FLAGS.some(key => config[key] === 'true') &&
        config.REDIS_BUILTIN === 'true' &&
        (0, bundled_host_1.namesBundledContainer)('redis', host));
}
function builtinRedisTlsError(config) {
    if (!usesBundledRedis(config) || config.REDIS_TLS !== 'true')
        return null;
    return ('REDIS_TLS=true cannot reach the built-in Redis container, which runs without TLS; set REDIS_TLS=false in the ' +
        `environment, ./.env or data/.env.generated, ${EXTERNAL_REDIS_WAY_OUT}`);
}
function builtinRedisUsernameError(config) {
    const username = typeof config.REDIS_USERNAME === 'string' ? config.REDIS_USERNAME : undefined;
    if (!usesBundledRedis(config) || !username || username === 'default')
        return null;
    return ('REDIS_USERNAME must be unset or default for the built-in Redis container; remove the named username in the ' +
        `environment, ./.env or data/.env.generated, ${EXTERNAL_REDIS_WAY_OUT}`);
}
function s3EndpointError(config) {
    const raw = config.S3_ENDPOINT;
    const endpoint = typeof raw === 'string' ? raw.trim() : '';
    if (!endpoint || config.STORAGE_TYPE !== 's3')
        return null;
    let protocol;
    try {
        protocol = new URL(endpoint).protocol;
    }
    catch {
        protocol = undefined;
    }
    if (protocol === 'http:' || protocol === 'https:')
        return null;
    return ('S3_ENDPOINT must be an absolute http(s) URL such as "http://minio:9000"; set it in the environment, ./.env or ' +
        'data/.env.generated, or on the Infrastructure page');
}
function validateEnv(config) {
    const errors = [];
    const str = (key) => {
        const value = config[key];
        return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
    };
    const rawEnum = (key) => {
        const value = config[key];
        return typeof value === 'string' && value.trim() !== '' ? value : undefined;
    };
    const dbType = rawEnum('DATABASE_TYPE');
    if (dbType && dbType !== 'sqlite' && dbType !== 'postgres') {
        errors.push(`DATABASE_TYPE must be "sqlite" or "postgres" (got ${JSON.stringify(dbType)})`);
    }
    const checkEnum = (key, allowed) => {
        const value = rawEnum(key);
        if (value !== undefined && !allowed.includes(value)) {
            errors.push(`${key} must be one of ${allowed.map(v => `"${v}"`).join(', ')} (got ${JSON.stringify(value)})`);
        }
    };
    checkEnum('ENGINE_TYPE', ['whatsapp-web.js', 'baileys']);
    checkEnum('STORAGE_TYPE', ['local', 's3']);
    checkEnum('MESSAGE_INLINE_MEDIA', ['inline', 'archive']);
    if (rawEnum('MESSAGE_INLINE_MEDIA') === 'archive' && config.CHAT_MEDIA_ARCHIVE_ENABLED !== 'true') {
        errors.push('MESSAGE_INLINE_MEDIA=archive needs CHAT_MEDIA_ARCHIVE_ENABLED=true');
    }
    const s3KeyPrefix = str('S3_KEY_PREFIX');
    if (s3KeyPrefix !== undefined && (0, s3_key_prefix_1.normalizeS3KeyPrefix)(s3KeyPrefix) === null) {
        errors.push(`S3_KEY_PREFIX must be a relative key prefix such as "staging/" with no empty, "." or ".." segment (got ${JSON.stringify(s3KeyPrefix)})`);
    }
    const queuePrefix = str('QUEUE_PREFIX');
    if (queuePrefix !== undefined && !/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(queuePrefix)) {
        errors.push(`QUEUE_PREFIX must be 1 to 64 letters, digits, dots, underscores or hyphens, starting with a letter or digit (got ${JSON.stringify(queuePrefix)})`);
    }
    const nodeEnvAllowed = ['production', 'development', 'test'];
    const rawNodeEnv = config.NODE_ENV;
    if (typeof rawNodeEnv === 'string' && rawNodeEnv !== '' && !nodeEnvAllowed.includes(rawNodeEnv)) {
        errors.push(`NODE_ENV must be one of ${nodeEnvAllowed.map(v => `"${v}"`).join(', ')} (got "${rawNodeEnv}")`);
    }
    if (dbType === 'postgres') {
        for (const key of ['DATABASE_HOST', 'DATABASE_USERNAME', 'DATABASE_PASSWORD']) {
            if (!str(key)) {
                errors.push(`${key} is required when DATABASE_TYPE=postgres`);
            }
        }
        if (config['DATABASE_SYNCHRONIZE'] === 'true') {
            errors.push('DATABASE_SYNCHRONIZE=true is not allowed with DATABASE_TYPE=postgres: the Postgres data connection always runs migrations, and synchronize would drop the migration-created body_ts tsvector column that /search depends on (returns 501 on every restart). Set DATABASE_SYNCHRONIZE=false (the production default) and manage the schema via migrations.');
        }
        const pgSchema = config.POSTGRES_SCHEMA;
        const pgSchemaError = typeof pgSchema === 'string' && pgSchema !== '' ? postgresSchemaError(pgSchema) : null;
        if (pgSchemaError) {
            errors.push(pgSchemaError);
        }
        const dbHost = str('DATABASE_HOST');
        if (config.POSTGRES_BUILTIN === 'true' &&
            config.DATABASE_SSL === 'true' &&
            (0, bundled_host_1.namesBundledContainer)('postgres', dbHost)) {
            errors.push(`DATABASE_SSL=true cannot reach the built-in PostgreSQL container (POSTGRES_BUILTIN=true, DATABASE_HOST=${dbHost}), ` +
                'which runs without TLS: set DATABASE_SSL=false where it is set (data/.env.generated, the project .env or the environment)');
        }
    }
    else {
        const collision = sqliteDataMainPathCollision(config);
        if (collision) {
            errors.push(collision);
        }
        const dataDbName = str('DATABASE_NAME');
        if (dataDbName && !dataDbName.includes('/') && !dataDbName.includes('\\') && !/\.(sqlite|db)$/i.test(dataDbName)) {
            errors.push(`DATABASE_NAME must be a file path under the data volume for SQLite (e.g. ./data/openwa.sqlite); got ${JSON.stringify(dataDbName)}. A bare name is the PostgreSQL DB name — leave DATABASE_NAME unset for SQLite to use the default ./data/openwa.sqlite.`);
        }
    }
    const redisTlsError = builtinRedisTlsError(config);
    if (redisTlsError)
        errors.push(redisTlsError);
    const redisUsernameError = builtinRedisUsernameError(config);
    if (redisUsernameError)
        errors.push(redisUsernameError);
    const DECIMAL_INTEGER = /^\d+$/;
    const checkPort = (key, read = str) => {
        const raw = read(key);
        if (raw === undefined)
            return;
        const n = DECIMAL_INTEGER.test(raw) ? Number(raw) : NaN;
        if (!Number.isInteger(n) || n < 1 || n > 65535) {
            errors.push(`${key} must be an integer port in [1, 65535] (got "${raw}")`);
        }
    };
    checkPort('PORT', key => {
        const value = config[key];
        return typeof value === 'string' && value !== '' ? value : undefined;
    });
    checkPort('DATABASE_PORT');
    checkPort('REDIS_PORT');
    const checkNonNegativeInt = (key) => {
        const raw = str(key);
        if (raw === undefined)
            return;
        const n = DECIMAL_INTEGER.test(raw) ? Number(raw) : NaN;
        if (!Number.isInteger(n) || n < 0) {
            errors.push(`${key} must be a non-negative integer (got "${raw}")`);
        }
    };
    for (const key of [
        'WEBHOOK_RETRY_DELAY',
        'DATABASE_POOL_SIZE',
        'DATABASE_STATEMENT_TIMEOUT_MS',
        'DATABASE_IDLE_TIMEOUT_MS',
        'DATABASE_CONNECTION_TIMEOUT_MS',
        'REDIS_CONNECT_TIMEOUT_MS',
        'MAX_CONCURRENT_SESSIONS',
        'WEBHOOK_DISPATCH_MAX_QUEUED',
        'STATS_CACHE_TTL_MS',
        'WEBHOOK_MAX_PER_SESSION',
        'AUTOMATION_MAX_PER_SESSION',
        'WEBHOOK_MEDIA_INLINE_MAX_BYTES',
        'WEBHOOK_FAILURE_PAYLOAD_RETENTION_HOURS',
        'EXPORT_INLINE_MEDIA_BUDGET_BYTES',
        'MESSAGE_LIST_INLINE_MEDIA_BUDGET_BYTES',
        'CHAT_MEDIA_ARCHIVE_TTL_DAYS',
        'INGRESS_RETRY_DELAY_MS',
        'REDIS_CACHE_DB',
        'INBOUND_MEDIA_GLOBAL_CONCURRENCY',
        'SHUTDOWN_DELAY_MS',
        'WEBHOOK_SHUTDOWN_DRAIN_MS',
        'MESSAGE_REAPER_INTERVAL_MS',
        'WEBHOOK_RECONCILE_INTERVAL_MS',
        'INGRESS_RECONCILE_INTERVAL_MS',
        'MESSAGE_REAPER_GRACE_MS',
        'WEBHOOK_RECONCILE_GRACE_MS',
        'INGRESS_RECONCILE_GRACE_MS',
        'BAILEYS_GROUP_METADATA_CACHE_TTL_MS',
    ]) {
        checkNonNegativeInt(key);
    }
    const SIGNED_DECIMAL_INTEGER = /^-?\d+$/;
    const checkInt = (key) => {
        const raw = str(key);
        if (raw === undefined)
            return;
        const n = SIGNED_DECIMAL_INTEGER.test(raw) ? Number(raw) : NaN;
        if (!Number.isInteger(n)) {
            errors.push(`${key} must be an integer (got "${raw}")`);
        }
    };
    for (const key of [
        'AUDIT_RETENTION_DAYS',
        'MESSAGE_RETENTION_DAYS',
        'WEBHOOK_FAILURE_RETENTION_DAYS',
        'INGRESS_RETENTION_DAYS',
        'WEBHOOK_OUTBOX_RETENTION_DAYS',
        'INGRESS_DEDUP_RETENTION_DAYS',
    ]) {
        checkInt(key);
    }
    for (const key of [
        'MESSAGE_RETENTION_DAYS',
        'AUDIT_RETENTION_DAYS',
        'CHAT_MEDIA_ARCHIVE_TTL_DAYS',
        'WEBHOOK_FAILURE_RETENTION_DAYS',
        'WEBHOOK_OUTBOX_RETENTION_DAYS',
        'INGRESS_RETENTION_DAYS',
        'INGRESS_DEDUP_RETENTION_DAYS',
    ]) {
        const days = str(key);
        if (days !== undefined && Number(days) > 36500) {
            errors.push(`${key} must be at most 36500 (got "${days}")`);
        }
    }
    {
        const hours = str('WEBHOOK_FAILURE_PAYLOAD_RETENTION_HOURS');
        if (hours !== undefined && Number(hours) > 36500 * 24) {
            errors.push(`WEBHOOK_FAILURE_PAYLOAD_RETENTION_HOURS must be at most ${36500 * 24} (got "${hours}")`);
        }
    }
    for (const key of ['MESSAGE_REAPER_GRACE_MS', 'WEBHOOK_RECONCILE_GRACE_MS', 'INGRESS_RECONCILE_GRACE_MS']) {
        const raw = str(key);
        if (raw !== undefined && DECIMAL_INTEGER.test(raw) && Number(raw) > 36500 * 86_400_000) {
            errors.push(`${key} must be at most ${36500 * 86_400_000} ms, 36500 days (got "${raw}")`);
        }
    }
    for (const key of ['BAILEYS_WA_VERSION']) {
        const raw = str(key);
        if (raw !== undefined) {
            const match = raw.match(/^(\d+)[.,](\d+)[.,](\d+)$/);
            if (!match) {
                errors.push(`${key} must be a valid WhatsApp Web version (e.g. "2.3000.1045340097"; got ${JSON.stringify(raw)})`);
            }
            else {
                const major = parseInt(match[1], 10);
                const minor = parseInt(match[2], 10);
                const patch = parseInt(match[3], 10);
                if (major !== 2 || minor < 2000 || patch < 0) {
                    errors.push(`${key} must be a valid WhatsApp Web version (e.g. "2.3000.1045340097"; got ${JSON.stringify(raw)})`);
                }
            }
        }
    }
    const checkPositiveInt = (key) => {
        const raw = str(key);
        if (raw === undefined)
            return;
        const n = DECIMAL_INTEGER.test(raw) ? Number(raw) : NaN;
        if (!Number.isInteger(n) || n < 1) {
            errors.push(`${key} must be a positive integer (got "${raw}")`);
        }
    };
    for (const key of [
        'RATE_LIMIT_SHORT_LIMIT',
        'RATE_LIMIT_MEDIUM_LIMIT',
        'RATE_LIMIT_LONG_LIMIT',
        'RATE_LIMIT_SHORT_TTL',
        'RATE_LIMIT_MEDIUM_TTL',
        'RATE_LIMIT_LONG_TTL',
        'INGRESS_INSTANCE_TTL',
        'WS_RATE_LIMIT_FRAME_PER_SECOND',
        'WS_RATE_LIMIT_FRAME_BURST',
        'WS_RATE_LIMIT_HANDSHAKE_MAX',
        'WS_RATE_LIMIT_HANDSHAKE_WINDOW_MS',
        'WS_MAX_SOCKETS_PER_KEY',
        'WEBHOOK_TIMEOUT',
        'INGRESS_INSTANCE_LIMIT',
        'INGRESS_IP_LIMIT',
        'REQUEST_TIMEOUT_MS',
        'HEADERS_TIMEOUT_MS',
        'KEEPALIVE_TIMEOUT_MS',
        'WEBHOOK_DISPATCH_CONCURRENCY',
        'WEBHOOK_DEGRADED_SESSION_CONCURRENCY',
        'WEBHOOK_MAX_PAYLOAD_BYTES',
        'INFLIGHT_BODY_BUDGET_BYTES',
        'MEDIA_CONVERSION_TIMEOUT_MS',
        'MEDIA_CONVERSION_MAX_OUTPUT_BYTES',
        'MEDIA_CONVERSION_CONCURRENCY',
        'SESSION_LEASE_TTL_MS',
        'SESSION_LEASE_HEARTBEAT_MS',
        'SESSION_TAKEOVER_SWEEP_MS',
        'SESSION_PROXY_TIMEOUT_MS',
        'PUPPETEER_PROTOCOL_TIMEOUT_MS',
        'SSRF_DNS_TIMEOUT_MS',
        'MEDIA_DOWNLOAD_MAX_BYTES',
        'MEDIA_DOWNLOAD_TIMEOUT_MS',
        'INBOUND_MEDIA_CONCURRENCY',
        'CHAT_HISTORY_MEDIA_BUDGET_BYTES',
        'CHAT_MEDIA_ARCHIVE_MAX_BYTES',
        'CHAT_MEDIA_ORPHAN_SWEEP_INTERVAL_MS',
        'CHAT_MEDIA_ORPHAN_GRACE_MS',
        'STATUS_MEDIA_MAX_BYTES',
        'STATUS_ORPHAN_SWEEP_INTERVAL_MS',
        'STATUS_ORPHAN_GRACE_MS',
        'S3_REPROBE_INTERVAL_MS',
        'STORAGE_EXPORT_TTL_MS',
        'STORAGE_EXPORT_SWEEP_MAX_AGE_MS',
        'PLUGIN_DOWNLOAD_MAX_BYTES',
        'PLUGIN_STORAGE_MAX_BYTES',
        'PLUGIN_CAP_TIMEOUT_MS',
        'TEMPLATE_RENDER_MAX_CHARS',
        'STORAGE_IMPORT_MAX_BYTES',
        'STORAGE_IMPORT_MAX_ENTRIES',
        'STORAGE_IMPORT_MAX_TOTAL_BYTES',
        'BAILEYS_MESSAGE_STORE_LIMIT',
        'SEARCH_LIMIT_MAX',
        'INGRESS_MAX_ATTEMPTS',
        'WEBHOOK_WORKER_CONCURRENCY',
        'INGRESS_WORKER_CONCURRENCY',
    ]) {
        checkPositiveInt(key);
    }
    const bodyLimit = str('BODY_SIZE_LIMIT');
    if (bodyLimit !== undefined && ((0, bootstrap_security_1.resolveBodyLimit)(bodyLimit) !== bodyLimit || (0, inflight_body_budget_1.parseBodyLimitBytes)(bodyLimit) < 1)) {
        errors.push(`BODY_SIZE_LIMIT must be a positive size such as 25mb or 1048576 (units b, kb, mb, gb, tb, pb; got "${bodyLimit}")`);
    }
    for (const [key, consequence] of [
        ['PUPPETEER_PROTOCOL_TIMEOUT_MS', 'the browser never finishes launching'],
        ['MEDIA_CONVERSION_TIMEOUT_MS', 'every conversion is killed as timed out'],
        ['CHAT_MEDIA_ORPHAN_SWEEP_INTERVAL_MS', 'the orphan sweep reruns every millisecond'],
        ['STATUS_ORPHAN_SWEEP_INTERVAL_MS', 'the orphan sweep reruns every millisecond'],
        ['S3_REPROBE_INTERVAL_MS', 'S3 is re-probed every millisecond while it is down'],
        ['STORAGE_EXPORT_TTL_MS', 'the export archive is deleted about 1 ms after it is written'],
        ['SESSION_TAKEOVER_SWEEP_MS', 'the takeover sweep reruns every millisecond'],
        ['SESSION_LEASE_HEARTBEAT_MS', 'the lease heartbeat renews every millisecond'],
        ['SESSION_PROXY_TIMEOUT_MS', 'every proxied request times out after 1 ms'],
        ['MEDIA_DOWNLOAD_TIMEOUT_MS', 'every media download fails'],
        ['WEBHOOK_TIMEOUT', 'every webhook delivery fails'],
        ['RATE_LIMIT_SHORT_TTL', 'each hit expires after 1 ms and that rate-limit tier never blocks'],
        ['RATE_LIMIT_MEDIUM_TTL', 'each hit expires after 1 ms and that rate-limit tier never blocks'],
        ['RATE_LIMIT_LONG_TTL', 'each hit expires after 1 ms and that rate-limit tier never blocks'],
        ['INGRESS_INSTANCE_TTL', 'each hit expires after 1 ms and the ingress rate limits never block'],
        ['SSRF_DNS_TIMEOUT_MS', 'every guarded DNS lookup times out, failing webhook deliveries and URL downloads'],
        ['MESSAGE_REAPER_INTERVAL_MS', 'the pending message reaper reruns every millisecond'],
        ['WEBHOOK_RECONCILE_INTERVAL_MS', 'the webhook reconciler reruns every millisecond'],
        ['INGRESS_RECONCILE_INTERVAL_MS', 'the ingress reconciler reruns every millisecond'],
        ['DATABASE_CONNECTION_TIMEOUT_MS', 'every pool connect times out'],
        ['DATABASE_IDLE_TIMEOUT_MS', 'each idle pool connection is closed 1 ms after release'],
    ]) {
        const raw = str(key);
        const n = raw !== undefined && DECIMAL_INTEGER.test(raw) ? Number(raw) : NaN;
        if (Number.isInteger(n) && n > MAX_TIMER_MS) {
            errors.push(`${key} must not exceed ${MAX_TIMER_MS} ms (got "${raw}"): Node's ` +
                `timers overflow above that and fire after 1 ms, so ${consequence}`);
        }
    }
    const statementTimeout = str('DATABASE_STATEMENT_TIMEOUT_MS');
    if (statementTimeout !== undefined &&
        DECIMAL_INTEGER.test(statementTimeout) &&
        Number(statementTimeout) > MAX_TIMER_MS) {
        errors.push(`DATABASE_STATEMENT_TIMEOUT_MS must not exceed ${MAX_TIMER_MS} ms (got "${statementTimeout}"): ` +
            'PostgreSQL refuses a larger statement_timeout, so every runtime connection fails');
    }
    for (const [key, factor, multiple, consequence] of [
        ['PLUGIN_CAP_TIMEOUT_MS', 4, 'send verbs wait four times this long', 'every plugin send times out'],
        [
            'WEBHOOK_RETRY_DELAY',
            8,
            'the last direct-delivery retry waits eight times this long',
            'webhook retries fire back to back',
        ],
    ]) {
        const raw = str(key);
        const max = Math.floor(MAX_TIMER_MS / factor);
        if (raw !== undefined && DECIMAL_INTEGER.test(raw) && Number(raw) > max) {
            errors.push(`${key} must not exceed ${max} ms (got "${raw}"): ${multiple}, ` +
                `and Node's timers overflow above that and fire after 1 ms, so ${consequence}`);
        }
    }
    const leaseTtlMs = Number(str('SESSION_LEASE_TTL_MS') ?? '60000');
    const heartbeatMs = Number(str('SESSION_LEASE_HEARTBEAT_MS') ?? '20000');
    if (Number.isInteger(leaseTtlMs) && Number.isInteger(heartbeatMs) && heartbeatMs * 2 >= leaseTtlMs) {
        errors.push(`SESSION_LEASE_HEARTBEAT_MS (${heartbeatMs}) must be less than half of SESSION_LEASE_TTL_MS (${leaseTtlMs}) ` +
            'so a renewal that is late or fails once still lands inside the lease');
    }
    const nodeUrl = str('NODE_URL');
    if (nodeUrl) {
        let parsed;
        try {
            parsed = new URL(nodeUrl);
        }
        catch {
            parsed = undefined;
        }
        if (!parsed || (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')) {
            errors.push(`NODE_URL must be an absolute http(s) URL (got "${nodeUrl}")`);
        }
        else if (parsed.username || parsed.password) {
            errors.push('NODE_URL must not embed credentials — the forwarder cannot send a URL with a userinfo component');
        }
    }
    const checkBool = (key) => {
        const raw = config[key];
        if (raw === undefined)
            return;
        if (typeof raw !== 'string') {
            errors.push(`${key} must be "true" or "false"`);
            return;
        }
        if (raw.trim() === '')
            return;
        if (raw !== 'true' && raw !== 'false') {
            errors.push(`${key} must be "true" or "false" (got ${JSON.stringify(raw)})`);
        }
    };
    for (const key of [
        'QUEUE_ENABLED',
        'MCP_ENABLED',
        'SERVE_DASHBOARD',
        'AUTO_START_SESSIONS',
        'STATUS_SEED_ON_READY',
        'STORE_EPHEMERAL_MESSAGES',
        'RESOLVE_LID_TO_PHONE',
        'SIMULATE_TYPING',
        'SEARCH_ENABLED',
        'SEARCH_CONTAINS_ENABLED',
        'REDIS_ENABLED',
        'REDIS_TLS',
        'PLUGIN_DOWNLOAD_ALLOW_INSECURE_REDIRECTS',
        'SEND_PACING_ENABLED',
        'MEDIA_CONVERSION_ENABLED',
        'CHAT_MEDIA_ARCHIVE_ENABLED',
        'CHAT_MEDIA_ARCHIVE_OUTBOUND',
        'DATABASE_SSL',
        'DATABASE_SSL_REJECT_UNAUTHORIZED',
        'MAIN_DATABASE_SYNCHRONIZE',
        'DATABASE_SYNCHRONIZE',
        'ALLOW_UNSIGNED_INGRESS',
        'ALLOW_DEV_API_KEY',
        'WEBHOOK_SSRF_PROTECT',
        'WEBHOOK_CONTACT_DETAILS',
        'SESSION_PROXY_URL_FETCH',
        'UPDATE_CHECK_ENABLED',
        'BAILEYS_SYNC_FULL_HISTORY',
        'BAILEYS_MARK_ONLINE_ON_CONNECT',
        'POSTGRES_BUILTIN',
        'REDIS_BUILTIN',
        'MINIO_BUILTIN',
        'CACHE_ENABLED',
        'DATABASE_LOGGING',
        'CSP_UPGRADE_INSECURE_REQUESTS',
        'ENABLE_SWAGGER',
        'VALIDATION_ERROR_DETAIL',
        'PLUGIN_INSTALL_REQUIRE_PIN',
        'WEBHOOK_SSRF_REDIRECTS',
    ]) {
        checkBool(key);
    }
    const LENIENT_BOOL_VALUES = new Set(['true', '1', 'yes', 'false', '0', 'no']);
    const lenientBoolKey = 'MEDIA_DOWNLOAD_ENABLED';
    const lenientRaw = config[lenientBoolKey];
    if (lenientRaw !== undefined) {
        if (typeof lenientRaw !== 'string') {
            errors.push(`${lenientBoolKey} must be one of true/false/1/0/yes/no`);
        }
        else {
            const normalized = lenientRaw.trim().toLowerCase();
            if (normalized !== '' && !LENIENT_BOOL_VALUES.has(normalized)) {
                errors.push(`${lenientBoolKey} must be one of true/false/1/0/yes/no (got ${JSON.stringify(lenientRaw)}) — ` +
                    'an unrecognised value silently means ENABLED');
            }
        }
    }
    const provider = config['SEARCH_PROVIDER'];
    if (provider !== undefined && provider !== '' && !['auto', 'builtin-fts', 'none'].includes(provider)) {
        errors.push(`SEARCH_PROVIDER must be one of: auto, builtin-fts, none (got ${JSON.stringify(provider)})`);
    }
    const LOG_LEVEL_VALUES = ['error', 'warn', 'info', 'debug', 'verbose'];
    const rawLogLevel = str('LOG_LEVEL');
    if (rawLogLevel !== undefined && !LOG_LEVEL_VALUES.includes(rawLogLevel.toLowerCase())) {
        errors.push(`LOG_LEVEL must be one of ${LOG_LEVEL_VALUES.map(v => `"${v}"`).join(', ')} (got ${JSON.stringify(rawLogLevel)})`);
    }
    if (errors.length > 0) {
        throw new Error(`Invalid environment configuration:\n  - ${errors.join('\n  - ')}`);
    }
    return config;
}
//# sourceMappingURL=env.validation.js.map