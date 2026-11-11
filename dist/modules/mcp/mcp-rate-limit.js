"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyRateLimiter = void 0;
exports.readRateLimitConfig = readRateLimitConfig;
exports.readIpRateLimitConfig = readIpRateLimitConfig;
const common_1 = require("@nestjs/common");
const env_int_1 = require("../../common/utils/env-int");
const ws_rate_limit_1 = require("../events/ws-rate-limit");
const DEFAULT_MAX = 60;
const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_IP_MAX = 120;
const DEFAULT_MAX_KEYS = 50_000;
function readRateLimitConfig(env = process.env) {
    return {
        max: (0, env_int_1.positiveIntOrDefault)(env['MCP_RATE_LIMIT_MAX'], DEFAULT_MAX),
        windowMs: (0, env_int_1.positiveIntOrDefault)(env['MCP_RATE_LIMIT_WINDOW_MS'], DEFAULT_WINDOW_MS),
    };
}
function readIpRateLimitConfig(env = process.env) {
    return {
        max: (0, env_int_1.positiveIntOrDefault)(env['MCP_IP_RATE_LIMIT_MAX'], DEFAULT_IP_MAX),
        windowMs: (0, env_int_1.positiveIntOrDefault)(env['MCP_IP_RATE_LIMIT_WINDOW_MS'], DEFAULT_WINDOW_MS),
    };
}
class KeyRateLimiter {
    window;
    constructor(max = 60, windowMs = 60_000, now = () => Date.now(), maxKeys = DEFAULT_MAX_KEYS) {
        this.window = new ws_rate_limit_1.SlidingWindowLimiter(max, windowMs, now, maxKeys);
    }
    check(key) {
        if (!this.window.allow(key)) {
            throw new common_1.HttpException('MCP rate limit exceeded', common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
    }
}
exports.KeyRateLimiter = KeyRateLimiter;
//# sourceMappingURL=mcp-rate-limit.js.map