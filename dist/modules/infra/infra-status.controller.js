"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var InfraStatusController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InfraStatusController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const infra_response_dto_1 = require("./dto/infra-response.dto");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const queue_names_1 = require("../queue/queue-names");
const redis_connection_1 = require("../queue/redis-connection");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("typeorm");
const typeorm_2 = require("@nestjs/typeorm");
const auth_decorators_1 = require("../auth/decorators/auth.decorators");
const api_key_entity_1 = require("../auth/entities/api-key.entity");
const engine_factory_1 = require("../../engine/engine.factory");
const wa_web_version_1 = require("../../engine/wa-web-version");
const docker_1 = require("../docker");
const cache_service_1 = require("../../common/cache/cache.service");
const storage_service_1 = require("../../common/storage/storage.service");
const logger_service_1 = require("../../common/services/logger.service");
const generated_env_1 = require("./generated-env");
const saved_builtin_mode_1 = require("./saved-builtin-mode");
const env_precedence_1 = require("../../config/env-precedence");
const configuration_1 = require("../../config/configuration");
const update_check_1 = require("./update-check");
const DASHBOARD_PINNABLE_ENV_KEYS = [
    'DATABASE_TYPE',
    'POSTGRES_BUILTIN',
    'DATABASE_HOST',
    'DATABASE_PORT',
    'DATABASE_USERNAME',
    'DATABASE_PASSWORD',
    'DATABASE_NAME',
    'DATABASE_POOL_SIZE',
    'POSTGRES_SCHEMA',
    'DATABASE_SSL',
    'DATABASE_SSL_REJECT_UNAUTHORIZED',
    'REDIS_ENABLED',
    'REDIS_BUILTIN',
    'REDIS_TLS',
    'REDIS_USERNAME',
    'REDIS_HOST',
    'REDIS_PORT',
    'REDIS_PASSWORD',
    'QUEUE_ENABLED',
    'STORAGE_TYPE',
    'MINIO_BUILTIN',
    'S3_ENDPOINT',
    'S3_BUCKET',
    'S3_REGION',
    'S3_ACCESS_KEY_ID',
    'S3_SECRET_ACCESS_KEY',
    'STORAGE_LOCAL_PATH',
    'ENGINE_TYPE',
    'PUPPETEER_HEADLESS',
    'SESSION_DATA_PATH',
    'PUPPETEER_ARGS',
];
let InfraStatusController = class InfraStatusController {
    static { InfraStatusController_1 = this; }
    configService;
    mainDataSource;
    dataDataSource;
    engineFactory;
    dockerService;
    cacheService;
    storageService;
    webhookQueue;
    logger = (0, logger_service_1.createLogger)('InfraStatusController');
    constructor(configService, mainDataSource, dataDataSource, engineFactory, dockerService, cacheService, storageService, webhookQueue) {
        this.configService = configService;
        this.mainDataSource = mainDataSource;
        this.dataDataSource = dataDataSource;
        this.engineFactory = engineFactory;
        this.dockerService = dockerService;
        this.cacheService = cacheService;
        this.storageService = storageService;
        this.webhookQueue = webhookQueue;
    }
    static DB_PROBE_TIMEOUT_MS = 3000;
    async probeDbConnected(ds) {
        if (!ds.isInitialized)
            return false;
        let timer;
        try {
            await Promise.race([
                ds.query('SELECT 1'),
                new Promise((_resolve, reject) => {
                    timer = setTimeout(() => reject(new Error('db probe timeout')), InfraStatusController_1.DB_PROBE_TIMEOUT_MS);
                }),
            ]);
            return true;
        }
        catch {
            return false;
        }
        finally {
            if (timer)
                clearTimeout(timer);
        }
    }
    async getStatus() {
        const [mainDbConnected, dataDbConnected] = await Promise.all([
            this.probeDbConnected(this.mainDataSource),
            this.probeDbConnected(this.dataDataSource),
        ]);
        const dbConnected = mainDbConnected && dataDbConnected;
        const dbType = this.configService.get('dataDatabase.type', 'sqlite');
        const dbHost = this.configService.get('dataDatabase.host', 'localhost');
        const redisHost = process.env.REDIS_HOST || this.configService.get('redis.host', 'localhost');
        const redisPort = parseInt(process.env.REDIS_PORT || '', 10) || this.configService.get('redis.port', 6379);
        const redisEnabled = process.env.REDIS_ENABLED === 'true';
        const queueEnabled = this.configService.get('queue.enabled', false);
        const redisConnected = await this.cacheService.isAvailable();
        const storageType = this.configService.get('storage.type', 'local');
        const storagePath = this.configService.get('storage.localPath', './data/media');
        const storageBucket = this.configService.get('storage.s3.bucket');
        const engineType = this.configService.get('engine.type', 'whatsapp-web.js');
        let webVersion;
        let webVersionSource;
        if (engineType === 'whatsapp-web.js') {
            if ((0, wa_web_version_1.getEffectiveWebVersionInfo)().source === 'auto') {
                void (0, wa_web_version_1.resolveCurrentWebVersion)().catch(() => undefined);
            }
            const info = (0, wa_web_version_1.getEffectiveWebVersionInfo)();
            webVersion = info.version;
            webVersionSource = info.source;
        }
        const engineHeadless = this.configService.get('engine.puppeteer.headless', true) ?? true;
        const sessionDataPath = this.configService.get('engine.sessionDataPath', './data/sessions');
        const browserArgs = this.configService.get('engine.puppeteer.args')?.join(' ') || configuration_1.DEFAULT_PUPPETEER_ARGS.join(' ');
        const s3Endpoint = this.configService.get('storage.s3.endpoint');
        const running = this.dockerService.isDockerAvailable()
            ? await this.dockerService.getRunningBuiltinServices()
            : null;
        const savedBuiltin = this.readSavedBuiltinFlags();
        const dbBuiltIn = (running ? !!running.database : savedBuiltin.database) && (0, docker_1.namesBundledContainer)('postgres', dbHost);
        const redisBuiltIn = (running ? !!running.cache : savedBuiltin.cache) && (0, docker_1.namesBundledContainer)('redis', redisHost);
        const storageBuiltIn = (running ? !!running.storage : savedBuiltin.storage) && (0, docker_1.namesBundledContainer)('minio', s3Endpoint);
        const s3Available = storageType === 's3' ? await this.storageService.refreshS3Availability() : undefined;
        let webhooks = { pending: 0, completed: 0, failed: 0 };
        if (queueEnabled && this.webhookQueue) {
            try {
                await (0, redis_connection_1.producerReady)(this.webhookQueue);
                const counts = await this.webhookQueue.getJobCounts('wait', 'active', 'delayed', 'completed', 'failed');
                webhooks = {
                    pending: (counts.wait ?? 0) + (counts.active ?? 0) + (counts.delayed ?? 0),
                    completed: counts.completed ?? 0,
                    failed: counts.failed ?? 0,
                };
            }
            catch (error) {
                this.logger.warn('Failed to read webhook queue job counts', { error: String(error) });
            }
        }
        return {
            database: {
                connected: dbConnected,
                type: dbType,
                host: dbHost,
                builtIn: dbBuiltIn,
                ...(running ? { running: running.database === 'openwa' && savedBuiltin.database } : {}),
            },
            redis: {
                enabled: redisEnabled,
                connected: redisConnected,
                host: redisHost,
                port: redisPort,
                builtIn: redisBuiltIn,
                ...(running ? { running: running.cache === 'openwa' && savedBuiltin.cache } : {}),
            },
            queue: {
                enabled: queueEnabled,
                webhooks,
            },
            storage: {
                type: storageType,
                path: storagePath,
                ...(storageType === 's3' && storageBucket ? { bucket: storageBucket } : {}),
                ...(storageType === 's3' && s3Endpoint ? { endpoint: s3Endpoint } : {}),
                builtIn: storageBuiltIn,
                ...(running ? { running: running.storage === 'openwa' && savedBuiltin.storage } : {}),
                ...(storageType === 's3' ? { s3Available } : {}),
            },
            engine: {
                type: engineType,
                headless: engineHeadless,
                sessionDataPath,
                browserArgs,
                ...(engineType === 'whatsapp-web.js' ? { webVersion, webVersionSource } : {}),
            },
            envPinned: DASHBOARD_PINNABLE_ENV_KEYS.filter(env_precedence_1.isEnvPinned),
        };
    }
    readSavedBuiltinFlags() {
        try {
            const saved = (0, generated_env_1.readGeneratedEnv)();
            return {
                database: (0, saved_builtin_mode_1.effectiveBuiltInFlag)('database', saved),
                cache: (0, saved_builtin_mode_1.effectiveBuiltInFlag)('redis', saved),
                storage: (0, saved_builtin_mode_1.effectiveBuiltInFlag)('storage', saved),
            };
        }
        catch {
            return { database: false, cache: false, storage: false };
        }
    }
    getEngines() {
        return this.engineFactory.getAvailableEngines();
    }
    getCurrentEngine() {
        return { engineType: this.engineFactory.getCurrentEngine() };
    }
    getUpdateCheck() {
        return (0, update_check_1.checkForUpdate)();
    }
    healthCheck() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
        };
    }
};
exports.InfraStatusController = InfraStatusController;
__decorate([
    (0, common_1.Get)('status'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get infrastructure status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Infrastructure status', type: infra_response_dto_1.InfraStatusResponseDto }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InfraStatusController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Get)('engines'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get available WhatsApp engines' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of available engines', type: [infra_response_dto_1.AvailableEngineDto] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Array)
], InfraStatusController.prototype, "getEngines", null);
__decorate([
    (0, common_1.Get)('engines/current'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get current active engine' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Current engine info', type: infra_response_dto_1.InfraCurrentEngineResponseDto }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], InfraStatusController.prototype, "getCurrentEngine", null);
__decorate([
    (0, common_1.Get)('update-check'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.ADMIN),
    (0, swagger_1.ApiOperation)({
        summary: 'Compare the running version with the latest OpenWA release',
        description: 'Reads the latest published GitHub release through the SSRF-guarded fetch and caches it. ' +
            'Set UPDATE_CHECK_ENABLED=false to turn the outbound request off.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Update check result', type: infra_response_dto_1.InfraUpdateCheckResponseDto }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InfraStatusController.prototype, "getUpdateCheck", null);
__decorate([
    (0, common_1.Get)('health'),
    (0, auth_decorators_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Health check endpoint' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Process is up. This route does not probe dependencies — read /infra/status for those.',
        type: infra_response_dto_1.InfraHealthResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'Shutdown teardown has begun: every route except /api/health and /api/health/* answers 503 then. ' +
            'Probe /api/health/live for a check that survives teardown.',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], InfraStatusController.prototype, "healthCheck", null);
exports.InfraStatusController = InfraStatusController = InfraStatusController_1 = __decorate([
    (0, swagger_1.ApiTags)('infrastructure'),
    (0, common_1.Controller)('infra'),
    (0, auth_decorators_1.RequireUnscopedKey)(),
    __param(1, (0, typeorm_2.InjectDataSource)('main')),
    __param(2, (0, typeorm_2.InjectDataSource)('data')),
    __param(7, (0, common_1.Optional)()),
    __param(7, (0, bullmq_1.InjectQueue)(queue_names_1.QUEUE_NAMES.WEBHOOK)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        typeorm_1.DataSource,
        typeorm_1.DataSource,
        engine_factory_1.EngineFactory,
        docker_1.DockerService,
        cache_service_1.CacheService,
        storage_service_1.StorageService,
        bullmq_2.Queue])
], InfraStatusController);
//# sourceMappingURL=infra-status.controller.js.map