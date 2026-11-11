"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyDatabaseSection = applyDatabaseSection;
exports.applyRedisSection = applyRedisSection;
exports.applyStorageSection = applyStorageSection;
exports.applyEngineSection = applyEngineSection;
const common_1 = require("@nestjs/common");
const configuration_1 = require("../../config/configuration");
const env_precedence_1 = require("../../config/env-precedence");
const env_validation_1 = require("../../config/env.validation");
const docker_1 = require("../docker");
function setSecret(updates, key, value) {
    if (value)
        updates[key] = value;
}
function nextBootValue(key, existing) {
    return (0, env_precedence_1.isEnvPinned)(key) ? process.env[key] : existing[key];
}
function portValue(label, value) {
    const port = value.trim();
    if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535) {
        throw new common_1.BadRequestException(`${label} must be an integer port in [1, 65535] (got ${JSON.stringify(value)})`);
    }
    return port;
}
function sectionType(section, key, sent, existing, allowed) {
    if (sent)
        return sent;
    const stored = allowed.find(v => v === existing[key]);
    const pinned = (0, env_precedence_1.isEnvPinned)(key) ? allowed.find(v => v === process.env[key]) : undefined;
    if (stored && pinned && stored !== pinned)
        return null;
    const type = stored ?? pinned;
    if (type === undefined) {
        throw new common_1.BadRequestException(`${section}.type must be one of the following values: ${allowed.join(', ')}`);
    }
    return type;
}
function applyDatabaseSection(database, existing, ctx) {
    const { updates, staleKeys, profiles } = ctx;
    const type = sectionType('database', 'DATABASE_TYPE', database.type, existing, ['sqlite', 'postgres']);
    if (type === null)
        return;
    if (database.type)
        updates.DATABASE_TYPE = database.type;
    if (database.builtIn !== undefined) {
        updates.POSTGRES_BUILTIN = database.builtIn ? 'true' : 'false';
    }
    const dbBuiltIn = database.builtIn ?? (0, docker_1.namesBundledContainer)('postgres', existing.DATABASE_HOST);
    if (type === 'postgres') {
        const preserveBundledDetails = dbBuiltIn &&
            database.builtIn === undefined &&
            existing.DATABASE_TYPE === 'postgres' &&
            (0, docker_1.hostPinnedElsewhere)('postgres');
        if (dbBuiltIn && !preserveBundledDetails) {
            updates.DATABASE_HOST = 'postgres';
            updates.DATABASE_PORT = '5432';
            const servesStored = existing.DATABASE_TYPE === 'postgres' &&
                nextBootValue('DATABASE_TYPE', existing) === 'postgres' &&
                (0, docker_1.namesBundledContainer)('postgres', nextBootValue('DATABASE_HOST', existing));
            const servesRunning = process.env.DATABASE_TYPE === 'postgres' && (0, docker_1.namesBundledContainer)('postgres', process.env.DATABASE_HOST);
            const kept = servesStored ? existing : servesRunning ? process.env : {};
            updates.DATABASE_USERNAME = kept.DATABASE_USERNAME || 'openwa';
            const storedPassword = existing.DATABASE_TYPE === 'postgres' &&
                ((0, docker_1.namesBundledContainer)('postgres', existing.DATABASE_HOST) ||
                    (0, docker_1.namesBundledContainer)('postgres', nextBootValue('DATABASE_HOST', existing)))
                ? existing.DATABASE_PASSWORD
                : servesRunning
                    ? process.env.DATABASE_PASSWORD
                    : undefined;
            updates.DATABASE_PASSWORD = database.password || storedPassword || 'openwa';
            updates.DATABASE_NAME = kept.DATABASE_NAME || 'openwa';
            updates.POSTGRES_SCHEMA = kept.POSTGRES_SCHEMA || 'public';
        }
        else if (!dbBuiltIn) {
            if ((existing.DATABASE_TYPE !== 'postgres' || (0, docker_1.namesBundledContainer)('postgres', existing.DATABASE_HOST)) &&
                !database.password) {
                staleKeys.add('DATABASE_PASSWORD');
            }
            if (database.host !== undefined)
                updates.DATABASE_HOST = database.host.trim() || 'localhost';
            if (database.port !== undefined) {
                updates.DATABASE_PORT = database.port.trim() ? portValue('database.port', database.port) : '5432';
            }
            if (database.username !== undefined)
                updates.DATABASE_USERNAME = database.username.trim() || 'postgres';
            setSecret(updates, 'DATABASE_PASSWORD', database.password);
            if (database.database !== undefined)
                updates.DATABASE_NAME = database.database || 'openwa';
            else if (existing.DATABASE_TYPE !== 'postgres' && nextBootValue('DATABASE_TYPE', existing) !== 'postgres') {
                staleKeys.add('DATABASE_NAME');
            }
            if (database.schema !== undefined) {
                const schemaError = database.schema ? (0, env_validation_1.postgresSchemaError)(database.schema) : null;
                if (schemaError)
                    throw new common_1.BadRequestException(schemaError);
                updates.POSTGRES_SCHEMA = database.schema || 'public';
            }
        }
        if (dbBuiltIn)
            profiles.push('postgres');
        if (database.poolSize !== undefined && database.poolSize !== null) {
            if (!Number.isInteger(database.poolSize) || database.poolSize < 0) {
                throw new common_1.BadRequestException(`database.poolSize must be a non-negative integer (got ${JSON.stringify(database.poolSize)})`);
            }
            updates.DATABASE_POOL_SIZE = String(database.poolSize || 10);
        }
        if (dbBuiltIn && !(0, docker_1.hostPinnedElsewhere)('postgres')) {
            updates.DATABASE_SSL = 'false';
            staleKeys.add('DATABASE_SSL_REJECT_UNAUTHORIZED');
        }
        else if (!preserveBundledDetails && database.sslEnabled !== undefined) {
            updates.DATABASE_SSL = database.sslEnabled ? 'true' : 'false';
            if (database.sslEnabled) {
                updates.DATABASE_SSL_REJECT_UNAUTHORIZED = database.sslRejectUnauthorized === false ? 'false' : 'true';
            }
        }
    }
    else {
        updates.POSTGRES_BUILTIN = 'false';
        if (existing.DATABASE_TYPE === 'postgres')
            staleKeys.add('DATABASE_NAME');
        for (const k of [
            'DATABASE_HOST',
            'DATABASE_PORT',
            'DATABASE_USERNAME',
            'DATABASE_PASSWORD',
            'DATABASE_POOL_SIZE',
            'DATABASE_SSL',
            'DATABASE_SSL_REJECT_UNAUTHORIZED',
            'POSTGRES_SCHEMA',
        ]) {
            staleKeys.add(k);
        }
    }
}
function applyRedisSection(redis, existing, ctx) {
    const { updates, staleKeys, profiles } = ctx;
    if (redis.enabled !== undefined)
        updates.REDIS_ENABLED = redis.enabled ? 'true' : 'false';
    if (redis.builtIn !== undefined)
        updates.REDIS_BUILTIN = redis.builtIn ? 'true' : 'false';
    const redisBuiltIn = redis.builtIn ?? (0, docker_1.namesBundledContainer)('redis', existing.REDIS_HOST);
    if (redisBuiltIn && (redis.builtIn !== undefined || !(0, docker_1.hostPinnedElsewhere)('redis'))) {
        updates.REDIS_HOST = 'redis';
        updates.REDIS_PORT = '6379';
        if (!(0, docker_1.hostPinnedElsewhere)('redis')) {
            updates.REDIS_TLS = 'false';
            staleKeys.add('REDIS_USERNAME');
        }
        if (!redis.password)
            staleKeys.add('REDIS_PASSWORD');
    }
    else if (!redisBuiltIn) {
        if (redis.host !== undefined)
            updates.REDIS_HOST = redis.host.trim() || 'localhost';
        if (redis.port !== undefined) {
            updates.REDIS_PORT = redis.port.trim() ? portValue('redis.port', redis.port) : '6379';
        }
    }
    setSecret(updates, 'REDIS_PASSWORD', redis.password);
    const saved = (key) => updates[key] ?? existing[key];
    if ((0, docker_1.datastoreInUse)('redis', key => ((0, env_precedence_1.isEnvPinned)(key) ? process.env[key] : saved(key)))) {
        if (redisBuiltIn)
            profiles.push('redis');
    }
    else if (!(0, docker_1.datastoreInUse)('redis', saved)) {
        updates.REDIS_BUILTIN = 'false';
        if ((0, docker_1.namesBundledContainer)('redis', saved('REDIS_HOST')))
            staleKeys.add('REDIS_HOST');
    }
}
function applyStorageSection(storage, existing, ctx) {
    const { updates, staleKeys, profiles } = ctx;
    const type = sectionType('storage', 'STORAGE_TYPE', storage.type, existing, ['local', 's3']);
    if (type === null)
        return;
    if (storage.type)
        updates.STORAGE_TYPE = storage.type;
    if (storage.builtIn !== undefined) {
        updates.MINIO_BUILTIN = storage.builtIn ? 'true' : 'false';
    }
    if (type === 'local') {
        updates.MINIO_BUILTIN = 'false';
        if (storage.localPath !== undefined) {
            updates.STORAGE_LOCAL_PATH = storage.localPath || './data/media';
        }
        for (const k of [
            'S3_ENDPOINT',
            'S3_ACCESS_KEY_ID',
            'S3_SECRET_ACCESS_KEY',
            'S3_ACCESS_KEY',
            'S3_SECRET_KEY',
            'S3_BUCKET',
            'S3_REGION',
        ]) {
            staleKeys.add(k);
        }
    }
    else {
        staleKeys.add('STORAGE_LOCAL_PATH');
        const storageBuiltIn = storage.builtIn ?? (0, docker_1.namesBundledContainer)('minio', existing.S3_ENDPOINT);
        if (storageBuiltIn &&
            (storage.builtIn !== undefined || existing.STORAGE_TYPE !== 's3' || !(0, docker_1.hostPinnedElsewhere)('minio'))) {
            const keepKeys = existing.STORAGE_TYPE === 's3' &&
                ((0, docker_1.namesBundledContainer)('minio', existing.S3_ENDPOINT) ||
                    (0, docker_1.namesBundledContainer)('minio', nextBootValue('S3_ENDPOINT', existing)));
            const servesRunning = process.env.STORAGE_TYPE === 's3' && (0, docker_1.namesBundledContainer)('minio', process.env.S3_ENDPOINT);
            const keys = keepKeys ? existing : servesRunning ? process.env : {};
            updates.S3_ENDPOINT = 'http://minio:9000';
            updates.S3_ACCESS_KEY_ID = keys.S3_ACCESS_KEY_ID || keys.S3_ACCESS_KEY || 'minioadmin';
            updates.S3_SECRET_ACCESS_KEY = keys.S3_SECRET_ACCESS_KEY || keys.S3_SECRET_KEY || 'minioadmin';
            const servesStored = existing.STORAGE_TYPE === 's3' &&
                nextBootValue('STORAGE_TYPE', existing) === 's3' &&
                (0, docker_1.namesBundledContainer)('minio', nextBootValue('S3_ENDPOINT', existing));
            const kept = servesStored ? existing : servesRunning ? process.env : {};
            updates.S3_BUCKET = kept.S3_BUCKET || 'openwa';
            updates.S3_REGION = kept.S3_REGION || 'us-east-1';
        }
        else if (!storageBuiltIn) {
            if (existing.STORAGE_TYPE !== 's3' || (0, docker_1.namesBundledContainer)('minio', existing.S3_ENDPOINT)) {
                if (!storage.s3AccessKey)
                    staleKeys.add('S3_ACCESS_KEY_ID');
                if (!storage.s3SecretKey)
                    staleKeys.add('S3_SECRET_ACCESS_KEY');
                staleKeys.add('S3_ACCESS_KEY');
                staleKeys.add('S3_SECRET_KEY');
                if (!storage.s3Endpoint)
                    staleKeys.add('S3_ENDPOINT');
            }
            if (storage.s3Bucket !== undefined)
                updates.S3_BUCKET = storage.s3Bucket;
            if (storage.s3Region !== undefined)
                updates.S3_REGION = storage.s3Region || 'ap-southeast-1';
            setSecret(updates, 'S3_ACCESS_KEY_ID', storage.s3AccessKey);
            setSecret(updates, 'S3_SECRET_ACCESS_KEY', storage.s3SecretKey);
            if (storage.s3Endpoint !== undefined) {
                if (storage.s3Endpoint) {
                    updates.S3_ENDPOINT = storage.s3Endpoint;
                }
                else {
                    staleKeys.add('S3_ENDPOINT');
                }
            }
        }
        if (storageBuiltIn)
            profiles.push('minio');
    }
}
function applyEngineSection(engine, existing, ctx, engineFactory) {
    const { updates } = ctx;
    if (engine.type) {
        const validEngineIds = engineFactory.getAvailableEngines().map(e => e.id);
        if (!validEngineIds.includes(engine.type)) {
            throw new common_1.BadRequestException(`Unknown engine type: ${engine.type}`);
        }
        updates.ENGINE_TYPE = engine.type;
    }
    if (engine.headless !== undefined) {
        updates.PUPPETEER_HEADLESS = engine.headless ? 'true' : 'false';
    }
    if (engine.sessionDataPath !== undefined) {
        updates.SESSION_DATA_PATH = engine.sessionDataPath || './data/sessions';
    }
    if (engine.browserArgs !== undefined) {
        updates.PUPPETEER_ARGS = engine.browserArgs || configuration_1.DEFAULT_PUPPETEER_ARGS.join(' ');
    }
}
//# sourceMappingURL=config-sections.js.map