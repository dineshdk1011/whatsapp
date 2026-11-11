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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisThrottlerStorage = exports.THROTTLER_REDIS_QUIT_TIMEOUT_MS = void 0;
const common_1 = require("@nestjs/common");
const logger_service_1 = require("../services/logger.service");
exports.THROTTLER_REDIS_QUIT_TIMEOUT_MS = 2000;
const INCREMENT_WITH_TTL_LUA = `
local hits = redis.call('INCR', KEYS[1])
local ttl = redis.call('PTTL', KEYS[1])
if hits == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
  ttl = redis.call('PTTL', KEYS[1])
elseif ttl < 0 then
  -- A TTL-less key can only be legacy/corrupt state. Treat its accumulated count as void so an old
  -- stranded over-limit value cannot impose a fresh full-window block when it is repaired.
  redis.call('SET', KEYS[1], 1, 'PX', ARGV[1])
  hits = 1
  ttl = redis.call('PTTL', KEYS[1])
end
return {hits, ttl}
`;
let RedisThrottlerStorage = class RedisThrottlerStorage {
    redis;
    logger = (0, logger_service_1.createLogger)('RedisThrottlerStorage');
    constructor(redis) {
        this.redis = redis;
        this.redis.on('error', (error) => {
            this.logger.warn('Throttler Redis client error', { error: error.message });
        });
    }
    async onModuleDestroy() {
        const redis = this.redis;
        let timer;
        const deadline = new Promise(resolve => {
            timer = setTimeout(resolve, exports.THROTTLER_REDIS_QUIT_TIMEOUT_MS);
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
    async increment(key, ttl, limit, blockDuration, throttlerName) {
        const redisKey = `openwa:throttle:${throttlerName}:${key}`;
        try {
            const [hits, ttlMs] = (await this.redis.eval(INCREMENT_WITH_TTL_LUA, 1, redisKey, String(ttl)));
            const isBlocked = hits > limit;
            return {
                totalHits: hits,
                timeToExpire: ttlMs > 0 ? Math.ceil(ttlMs / 1000) : 0,
                isBlocked,
                timeToBlockExpire: isBlocked ? Math.max(1, Math.ceil(ttlMs / 1000)) : 0,
            };
        }
        catch (error) {
            this.logger.warn('Redis throttler storage failed; failing OPEN (allowing)', {
                error: error instanceof Error ? error.message : String(error),
            });
            return { totalHits: 0, timeToExpire: 0, isBlocked: false, timeToBlockExpire: 0 };
        }
    }
};
exports.RedisThrottlerStorage = RedisThrottlerStorage;
exports.RedisThrottlerStorage = RedisThrottlerStorage = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Function])
], RedisThrottlerStorage);
//# sourceMappingURL=redis-throttler.storage.js.map