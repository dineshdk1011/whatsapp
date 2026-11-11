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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = exports.CACHE_QUIT_TIMEOUT_MS = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = __importDefault(require("ioredis"));
const logger_service_1 = require("../services/logger.service");
const configuration_1 = require("../../config/configuration");
const redis_options_1 = require("../../config/redis-options");
const CACHE_COMMAND_TIMEOUT_MS = 2000;
exports.CACHE_QUIT_TIMEOUT_MS = 2000;
let CacheService = class CacheService {
    configService;
    logger = (0, logger_service_1.createLogger)('CacheService');
    redis = null;
    enabled;
    constructor(configService) {
        this.configService = configService;
        this.enabled = process.env.REDIS_ENABLED === 'true' || configService.get('cache.enabled', false);
        this.logger.log(`CacheService: enabled=${this.enabled}, REDIS_ENABLED=${process.env.REDIS_ENABLED}`);
    }
    ensureClient() {
        if (this.redis)
            return;
        const connection = (0, redis_options_1.redisConnectionOptions)();
        this.logger.log(`Connecting to Redis at ${connection.host}:${connection.port}`);
        const redis = new ioredis_1.default({
            ...connection,
            db: (0, configuration_1.resolveNonNegativeIntEnv)(process.env.REDIS_CACHE_DB, 1),
            lazyConnect: true,
            enableOfflineQueue: false,
            commandTimeout: CACHE_COMMAND_TIMEOUT_MS,
            socketTimeout: CACHE_COMMAND_TIMEOUT_MS,
            autoResendUnfulfilledCommands: false,
            maxRetriesPerRequest: 3,
            retryStrategy: times => Math.min(times * 500, 5000),
        });
        redis.on('error', err => {
            this.logger.warn(`Redis error: ${err.message}`);
        });
        redis.on('connect', () => {
            this.logger.log('Redis cache connected');
        });
        this.redis = redis;
        redis.connect().catch(() => undefined);
    }
    async ping() {
        if (!this.redis)
            return false;
        try {
            await this.redis.ping();
            return true;
        }
        catch (error) {
            this.logger.debug(`Redis ping failed: ${String(error)}`);
            return false;
        }
    }
    async onModuleDestroy() {
        if (!this.redis)
            return;
        const redis = this.redis;
        let timer;
        const deadline = new Promise(resolve => {
            timer = setTimeout(resolve, exports.CACHE_QUIT_TIMEOUT_MS);
            timer.unref();
        });
        try {
            await Promise.race([redis.quit().catch(() => undefined), deadline]);
        }
        finally {
            if (timer)
                clearTimeout(timer);
            redis.disconnect();
        }
    }
    async isAvailable() {
        if (!this.enabled)
            return false;
        this.ensureClient();
        return this.ping();
    }
};
exports.CacheService = CacheService;
exports.CacheService = CacheService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], CacheService);
//# sourceMappingURL=cache.service.js.map