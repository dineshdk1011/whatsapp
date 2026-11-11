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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InfraConfigController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const infra_response_dto_1 = require("./dto/infra-response.dto");
const restart_dto_1 = require("./dto/restart.dto");
const auth_decorators_1 = require("../auth/decorators/auth.decorators");
const api_key_entity_1 = require("../auth/entities/api-key.entity");
const secret_file_1 = require("../../common/utils/secret-file");
const engine_factory_1 = require("../../engine/engine.factory");
const docker_1 = require("../docker");
const shutdown_service_1 = require("../../common/services/shutdown.service");
const logger_service_1 = require("../../common/services/logger.service");
const audit_service_1 = require("../audit/audit.service");
const audit_log_entity_1 = require("../audit/entities/audit-log.entity");
const save_config_dto_1 = require("./dto/save-config.dto");
const bootstrap_security_1 = require("../../config/bootstrap-security");
const env_validation_1 = require("../../config/env.validation");
const env_precedence_1 = require("../../config/env-precedence");
const storage_root_1 = require("../../config/storage-root");
const crypto_1 = require("crypto");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const dotenv = __importStar(require("dotenv"));
const generated_env_1 = require("./generated-env");
const saved_builtin_mode_1 = require("./saved-builtin-mode");
const config_sections_1 = require("./config-sections");
const IN_PLACE_FALLBACK_CODES = ['EBUSY', 'EXDEV', 'EACCES', 'EPERM', 'EROFS'];
let InfraConfigController = class InfraConfigController {
    engineFactory;
    dockerService;
    shutdownService;
    auditService;
    logger = (0, logger_service_1.createLogger)('InfraConfigController');
    constructor(engineFactory, dockerService, shutdownService, auditService) {
        this.engineFactory = engineFactory;
        this.dockerService = dockerService;
        this.shutdownService = shutdownService;
        this.auditService = auditService;
    }
    getConfig() {
        const saved = (0, generated_env_1.readGeneratedEnv)();
        const effective = (key) => ((0, env_precedence_1.isEnvPinned)(key) ? process.env[key] : undefined) ?? saved[key];
        const databaseType = effective('DATABASE_TYPE') === 'postgres' ? 'postgres' : 'sqlite';
        return {
            database: {
                type: databaseType,
                ...(0, saved_builtin_mode_1.savedBuiltInMode)('database', saved),
                host: effective('DATABASE_HOST') || '',
                port: effective('DATABASE_PORT') || '',
                username: effective('DATABASE_USERNAME') || '',
                database: databaseType === 'postgres' ? effective('DATABASE_NAME') || '' : '',
                schema: effective('POSTGRES_SCHEMA') || 'public',
                poolSize: Number(effective('DATABASE_POOL_SIZE')) || 10,
                sslEnabled: effective('DATABASE_SSL') === 'true',
                sslRejectUnauthorized: effective('DATABASE_SSL_REJECT_UNAUTHORIZED') !== 'false',
                passwordSet: Boolean(effective('DATABASE_PASSWORD')),
            },
            redis: {
                enabled: effective('REDIS_ENABLED') === 'true',
                ...(0, saved_builtin_mode_1.savedBuiltInMode)('redis', saved),
                host: effective('REDIS_HOST') || '',
                port: effective('REDIS_PORT') || '',
                passwordSet: Boolean(effective('REDIS_PASSWORD')),
            },
            queue: { enabled: effective('QUEUE_ENABLED') === 'true' },
            storage: {
                type: effective('STORAGE_TYPE') === 's3' ? 's3' : 'local',
                ...(0, saved_builtin_mode_1.savedBuiltInMode)('storage', saved),
                localPath: effective('STORAGE_LOCAL_PATH') || '',
                s3Bucket: effective('S3_BUCKET') || '',
                s3Region: effective('S3_REGION') || '',
                s3Endpoint: effective('S3_ENDPOINT') || '',
                s3CredentialsSet: Boolean((effective('S3_ACCESS_KEY_ID') || effective('S3_ACCESS_KEY')) &&
                    (effective('S3_SECRET_ACCESS_KEY') || effective('S3_SECRET_KEY'))),
            },
            engine: {
                type: effective('ENGINE_TYPE') || 'whatsapp-web.js',
                headless: effective('PUPPETEER_HEADLESS') !== 'false',
                sessionDataPath: effective('SESSION_DATA_PATH') || '',
                browserArgs: effective('PUPPETEER_ARGS') || '',
            },
        };
    }
    saveConfig(config) {
        try {
            const profiles = [];
            const envPath = (0, generated_env_1.generatedEnvPath)();
            const existing = (0, generated_env_1.readGeneratedEnv)();
            const updates = {};
            const staleKeys = new Set();
            const ctx = { updates, staleKeys, profiles };
            this.applyConfigSections(config, existing, ctx);
            this.assertNoLineBreakValues(updates);
            const merged = this.mergeWithExisting(existing, ctx);
            this.assertProductionBootable(merged);
            this.assertBootValidates(existing, merged);
            this.assertStorageRootWritable(updates, merged);
            this.persistGeneratedEnv(envPath, merged);
            this.auditConfigSaved(config, profiles);
            return this.buildSaveResponse(envPath, profiles);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            return {
                message: `Failed to save configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
                saved: false,
                envPath: '',
                profiles: [],
            };
        }
    }
    applyConfigSections(config, existing, ctx) {
        const { updates } = ctx;
        if (config.database) {
            (0, config_sections_1.applyDatabaseSection)(config.database, existing, ctx);
        }
        if (config.queue) {
            if (config.queue.enabled !== undefined)
                updates.QUEUE_ENABLED = config.queue.enabled ? 'true' : 'false';
        }
        if (config.redis) {
            (0, config_sections_1.applyRedisSection)(config.redis, existing, ctx);
        }
        if (config.storage) {
            (0, config_sections_1.applyStorageSection)(config.storage, existing, ctx);
        }
        if (config.engine) {
            (0, config_sections_1.applyEngineSection)(config.engine, existing, ctx, this.engineFactory);
        }
    }
    assertNoLineBreakValues(updates) {
        for (const [key, value] of Object.entries(updates)) {
            if (/[\r\n]/.test(value)) {
                throw new common_1.BadRequestException(`Invalid configuration value for ${key}: line breaks are not allowed`);
            }
        }
    }
    mergeWithExisting(existing, ctx) {
        const { updates, staleKeys } = ctx;
        const merged = { ...existing, ...updates };
        for (const k of staleKeys) {
            delete merged[k];
        }
        return merged;
    }
    bootValueReader(merged) {
        return (key) => {
            if ((0, env_precedence_1.isEnvPinned)(key) && process.env[key] !== undefined)
                return process.env[key];
            const envValue = (0, env_precedence_1.isOsProvidedEnv)(key) ? process.env[key] : undefined;
            if (envValue !== undefined && (envValue.trim() !== '' || !env_precedence_1.BLANK_SHADOWED_ENV_KEYS.includes(key))) {
                return envValue;
            }
            return merged[key];
        };
    }
    assertProductionBootable(merged) {
        const bootValue = this.bootValueReader(merged);
        try {
            (0, bootstrap_security_1.assertNoDefaultSecretsInProduction)({
                nodeEnv: 'production',
                databaseType: bootValue('DATABASE_TYPE'),
                databasePassword: bootValue('DATABASE_PASSWORD'),
                postgresBuiltIn: bootValue('POSTGRES_BUILTIN'),
                databaseHost: bootValue('DATABASE_HOST'),
                storageType: bootValue('STORAGE_TYPE'),
                s3AccessKey: bootValue('S3_ACCESS_KEY_ID') || bootValue('S3_ACCESS_KEY'),
                s3SecretKey: bootValue('S3_SECRET_ACCESS_KEY') || bootValue('S3_SECRET_KEY'),
                s3Endpoint: bootValue('S3_ENDPOINT'),
                minioBuiltIn: bootValue('MINIO_BUILTIN'),
                redisPassword: bootValue('REDIS_PASSWORD'),
            });
        }
        catch (error) {
            const detail = error instanceof Error ? error.message : String(error);
            throw new common_1.BadRequestException(`Refusing to save a configuration that would be rejected at production boot. ${detail}`);
        }
    }
    assertBootValidates(existing, merged) {
        const bootValue = this.bootValueReader(merged);
        const before = this.bootValueReader(existing);
        try {
            const env = Object.fromEntries(Object.keys({ ...process.env, ...merged }).map(key => [key, bootValue(key)]));
            (0, env_validation_1.validateEnv)(env);
            const endpointChanged = (before('S3_ENDPOINT') ?? '').trim() !== (bootValue('S3_ENDPOINT') ?? '').trim();
            const newlyS3 = before('STORAGE_TYPE') !== 's3' && bootValue('STORAGE_TYPE') === 's3';
            const s3Problem = endpointChanged || newlyS3 ? (0, env_validation_1.s3EndpointError)(env) : null;
            if (s3Problem)
                throw new Error(s3Problem);
        }
        catch (error) {
            const detail = error instanceof Error ? error.message : String(error);
            throw new common_1.BadRequestException(`Refusing to save a configuration that fails boot validation. ${detail}`);
        }
    }
    assertStorageRootWritable(updates, merged) {
        const submitted = updates.STORAGE_LOCAL_PATH;
        if (submitted === undefined || this.bootValueReader(merged)('STORAGE_LOCAL_PATH') !== submitted)
            return;
        try {
            (0, storage_root_1.resolveStorageRoot)({ configured: submitted });
        }
        catch {
            throw new common_1.BadRequestException(`Refusing to save the storage path '${submitted}': the app cannot create or write it, and the next start ` +
                'would refuse to boot. Use a directory the app user owns, inside the data volume when running in ' +
                'Docker (for example ./data/media).');
        }
    }
    persistGeneratedEnv(envPath, merged) {
        const unreadable = (key) => new common_1.BadRequestException(`Invalid configuration value for ${key}: it cannot be stored so that it reads back unchanged`);
        const keys = Object.keys(merged).sort();
        const body = keys.map(key => {
            const encoded = (0, generated_env_1.encodeGeneratedEnvValue)(key, merged[key]);
            if (encoded === undefined)
                throw unreadable(key);
            return `${key}=${encoded}`;
        });
        const contents = [
            '# OpenWA Configuration',
            `# Generated at ${new Date().toISOString()}`,
            '# Managed via Dashboard > Infrastructure. Values in process env or project .env take precedence.',
            '',
            ...body,
            '',
        ].join('\n');
        const back = dotenv.parse(contents);
        const drifted = keys.find(key => back[key] !== merged[key]);
        if (drifted !== undefined)
            throw unreadable(drifted);
        const target = this.overlayTarget(envPath);
        if (target === undefined) {
            (0, secret_file_1.writeSecretFile)(envPath, contents);
        }
        else {
            const staged = `${target}.${(0, crypto_1.randomUUID)()}.tmp`;
            try {
                (0, secret_file_1.writeSecretFile)(staged, contents);
                fs.renameSync(staged, target);
            }
            catch (error) {
                try {
                    fs.rmSync(staged, { force: true });
                }
                catch {
                }
                if (!IN_PLACE_FALLBACK_CODES.includes(error.code ?? ''))
                    throw error;
                (0, secret_file_1.writeSecretFile)(target, contents);
            }
        }
        this.logger.log('Configuration saved', { envPath });
    }
    overlayTarget(envPath) {
        let isLink;
        try {
            isLink = fs.lstatSync(envPath).isSymbolicLink();
        }
        catch {
            return envPath;
        }
        if (!isLink)
            return envPath;
        try {
            return fs.realpathSync(envPath);
        }
        catch {
            return undefined;
        }
    }
    auditConfigSaved(config, profiles) {
        void this.auditService?.logInfo(audit_log_entity_1.AuditAction.INFRA_CONFIG_SAVED, {
            metadata: { sections: Object.keys(config ?? {}), profiles },
        });
    }
    buildSaveResponse(envPath, profiles) {
        const profileMsg = profiles.length > 0 ? ` Docker profiles required: ${profiles.join(', ')}.` : '';
        return {
            message: `Configuration saved successfully.${profileMsg} Server restart required to apply changes.`,
            saved: true,
            envPath: path.relative(process.cwd(), envPath),
            profiles,
        };
    }
    async requestRestart(body) {
        const requestedStart = body?.profiles || [];
        const pinnedElsewhere = requestedStart.filter(p => (0, docker_1.hostPinnedElsewhere)(p));
        const profiles = requestedStart.filter(p => !pinnedElsewhere.includes(p));
        if (pinnedElsewhere.length > 0) {
            this.logger.warn('Not starting profiles whose host the environment pins elsewhere', { pinnedElsewhere });
        }
        let saved;
        const dialsBundled = (profile) => {
            const bundled = docker_1.BUNDLED_SERVICE_ENV[profile];
            if (!bundled)
                return false;
            const [key] = bundled;
            const bootValue = this.bootValueReader((saved ??= (0, generated_env_1.readGeneratedEnv)()));
            return (0, docker_1.datastoreInUse)(profile, bootValue) && (0, docker_1.namesBundledContainer)(profile, bootValue(key));
        };
        const requestedRemoval = body?.profilesToRemove || [];
        const keptRunning = requestedRemoval.filter(dialsBundled);
        const profilesToRemove = requestedRemoval.filter(p => !keptRunning.includes(p));
        if (keptRunning.length > 0) {
            this.logger.warn('Keeping profiles the next boot still dials', { keptRunning });
        }
        let orchestrationResult;
        let removalResult;
        this.logger.log('Restart requested', { profiles });
        this.logger.log('Profiles to remove', { profilesToRemove });
        if (this.dockerService.isDockerAvailable()) {
            const requested = profilesToRemove.filter(p => !profiles.includes(p));
            const toRemove = requested.filter(p => docker_1.MANAGED_DOCKER_PROFILES.includes(p));
            const ignored = requested.filter(p => !docker_1.MANAGED_DOCKER_PROFILES.includes(p));
            if (ignored.length > 0) {
                this.logger.warn('Ignoring non-managed profiles in profilesToRemove', { ignored });
            }
            if (toRemove.length > 0) {
                this.logger.log('Stopping disabled profiles (containers retained)...', { toRemove });
                removalResult = { stopped: [], errors: [] };
                for (const profile of toRemove) {
                    try {
                        const success = await this.dockerService.stopManagedService(profile);
                        if (success) {
                            removalResult.stopped.push(profile);
                        }
                        else {
                            removalResult.errors.push(`Failed to stop ${profile}`);
                        }
                    }
                    catch (err) {
                        removalResult.errors.push(`Error stopping ${profile}: ${err instanceof Error ? err.message : String(err)}`);
                    }
                }
                this.logger.log('Teardown result', { removalResult });
            }
            const toStart = profiles.filter(p => docker_1.MANAGED_DOCKER_PROFILES.includes(p));
            const ignoredStart = profiles.filter(p => !docker_1.MANAGED_DOCKER_PROFILES.includes(p));
            if (ignoredStart.length > 0) {
                this.logger.warn('Ignoring non-managed profiles in profiles', { ignoredStart });
            }
            if (toStart.length > 0) {
                this.logger.log('Orchestrating enabled profiles...');
                orchestrationResult = await this.dockerService.orchestrateProfiles(toStart);
                this.logger.log('Orchestration result', { orchestrationResult });
            }
        }
        else {
            this.logger.warn('Docker not available, writing signal file instead');
            try {
                const signalFile = path.resolve(process.cwd(), 'data', '.orchestration-request.json');
                const toStart = profiles.filter(p => docker_1.MANAGED_DOCKER_PROFILES.includes(p));
                const toRemove = profilesToRemove.filter(p => !profiles.includes(p) && docker_1.MANAGED_DOCKER_PROFILES.includes(p));
                const ignored = [...profiles, ...profilesToRemove].filter(p => !docker_1.MANAGED_DOCKER_PROFILES.includes(p));
                if (ignored.length > 0) {
                    this.logger.warn('Ignoring non-managed profiles in the signal-file request', { ignored });
                }
                const orchestrationRequest = {
                    timestamp: new Date().toISOString(),
                    profiles: toStart,
                    profilesToRemove: toRemove,
                    action: 'restart-with-profiles',
                };
                fs.writeFileSync(signalFile, JSON.stringify(orchestrationRequest, null, 2), 'utf8');
                this.logger.log('Orchestration request written', { signalFile });
            }
            catch (err) {
                this.logger.error('Failed to write orchestration request', err instanceof Error ? err.message : String(err));
            }
        }
        await this.auditService?.logInfo(audit_log_entity_1.AuditAction.INFRA_RESTART_REQUESTED, {
            metadata: { profiles, profilesToRemove },
        });
        void this.shutdownService.shutdown();
        let estimatedTime = 15;
        if (profiles.includes('postgres'))
            estimatedTime += 20;
        if (profiles.includes('redis'))
            estimatedTime += 13;
        if (profiles.includes('minio'))
            estimatedTime += 15;
        if (profilesToRemove.length > 0)
            estimatedTime += profilesToRemove.length * 5;
        return {
            message: profiles.length > 0 || profilesToRemove.length > 0
                ? `Server is restarting. Enabling: ${profiles.join(', ') || 'none'}. Disabling: ${profilesToRemove.join(', ') || 'none'}.`
                : 'Server is restarting. Please wait...',
            restarting: true,
            profiles,
            profilesToRemove,
            estimatedTime,
            orchestration: orchestrationResult,
            removal: removalResult,
        };
    }
};
exports.InfraConfigController = InfraConfigController;
__decorate([
    (0, common_1.Get)('config'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Read the effective infrastructure configuration for the dashboard form' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Effective configuration (secrets omitted)', type: infra_response_dto_1.InfraConfigResponseDto }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], InfraConfigController.prototype, "getConfig", null);
__decorate([
    (0, common_1.Put)('config'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Save infrastructure configuration to .env file' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Save outcome. A failed disk write answers 200 with `saved: false`, so read the flag, not the status.',
        type: infra_response_dto_1.InfraConfigSaveResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Rejected before anything was written: an invalid or unknown field, an unknown engine type, a value with a ' +
            'line break or one that cannot be stored, a configuration that would not boot in production or that the boot ' +
            'environment validation rejects, or a media storage path the app cannot write to.',
    }),
    (0, swagger_1.ApiBody)({ description: 'Configuration to save', type: save_config_dto_1.SaveConfigDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [save_config_dto_1.SaveConfigDto]),
    __metadata("design:returntype", Object)
], InfraConfigController.prototype, "saveConfig", null);
__decorate([
    (0, common_1.Post)('restart'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Request server restart with Docker orchestration' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Server will restart with new profiles', type: infra_response_dto_1.InfraRestartResponseDto }),
    (0, swagger_1.ApiBody)({ required: false, type: restart_dto_1.RestartDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [restart_dto_1.RestartDto]),
    __metadata("design:returntype", Promise)
], InfraConfigController.prototype, "requestRestart", null);
exports.InfraConfigController = InfraConfigController = __decorate([
    (0, swagger_1.ApiTags)('infrastructure'),
    (0, common_1.Controller)('infra'),
    (0, auth_decorators_1.RequireUnscopedKey)(),
    __param(3, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [engine_factory_1.EngineFactory,
        docker_1.DockerService,
        shutdown_service_1.ShutdownService,
        audit_service_1.AuditService])
], InfraConfigController);
//# sourceMappingURL=infra-config.controller.js.map