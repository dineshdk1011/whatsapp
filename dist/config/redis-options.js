"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_REDIS_CONNECT_TIMEOUT_MS = void 0;
exports.redisConnectionOptions = redisConnectionOptions;
exports.DEFAULT_REDIS_CONNECT_TIMEOUT_MS = 5000;
function redisConnectionOptions() {
    return {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        username: process.env.REDIS_USERNAME,
        password: process.env.REDIS_PASSWORD,
        connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT_MS || String(exports.DEFAULT_REDIS_CONNECT_TIMEOUT_MS), 10),
        ...(process.env.REDIS_TLS === 'true' ? { tls: {} } : {}),
    };
}
//# sourceMappingURL=redis-options.js.map