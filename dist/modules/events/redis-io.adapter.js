"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisIoAdapter = exports.WS_REDIS_MAX_UNANSWERED = exports.WS_REDIS_SUBSCRIBER_SOCKET_TIMEOUT_MS = exports.WS_REDIS_SUBSCRIBER_PING_MS = exports.WS_REDIS_SOCKET_TIMEOUT_MS = exports.WS_REDIS_COMMAND_TIMEOUT_MS = exports.WS_REDIS_QUIT_TIMEOUT_MS = void 0;
exports.isWsRedisEnabled = isWsRedisEnabled;
exports.wsRedisOptions = wsRedisOptions;
exports.rejectRootNamespace = rejectRootNamespace;
const platform_socket_io_1 = require("@nestjs/platform-socket.io");
const redis_adapter_1 = require("@socket.io/redis-adapter");
const ioredis_1 = __importDefault(require("ioredis"));
const logger_service_1 = require("../../common/services/logger.service");
const redis_options_1 = require("../../config/redis-options");
const logger = (0, logger_service_1.createLogger)('RedisIoAdapter');
exports.WS_REDIS_QUIT_TIMEOUT_MS = 2000;
exports.WS_REDIS_COMMAND_TIMEOUT_MS = 2000;
exports.WS_REDIS_SOCKET_TIMEOUT_MS = 10_000;
exports.WS_REDIS_SUBSCRIBER_PING_MS = 15_000;
exports.WS_REDIS_SUBSCRIBER_SOCKET_TIMEOUT_MS = 30_000;
exports.WS_REDIS_MAX_UNANSWERED = 12_000;
const WS_REDIS_RESUME_UNANSWERED = exports.WS_REDIS_MAX_UNANSWERED / 2;
function unansweredCommands(client) {
    const queue = client.commandQueue;
    return typeof queue?.length === 'number' ? queue.length : 0;
}
function isWsRedisEnabled() {
    return process.env.REDIS_ENABLED === 'true';
}
function wsRedisOptions() {
    return {
        ...(0, redis_options_1.redisConnectionOptions)(),
        retryStrategy: times => Math.min(times * 500, 5000),
    };
}
function rejectRootNamespace(server) {
    server.of('/').use((_socket, next) => next(new Error('Invalid namespace')));
}
class RedisIoAdapter extends platform_socket_io_1.IoAdapter {
    pubClient;
    subClient;
    subPing;
    constructor(app) {
        super(app);
    }
    createIOServer(port, options) {
        const server = super.createIOServer(port, options);
        rejectRootNamespace(server);
        if (!isWsRedisEnabled())
            return server;
        try {
            const pubClient = new ioredis_1.default({
                ...wsRedisOptions(),
                commandTimeout: exports.WS_REDIS_COMMAND_TIMEOUT_MS,
                socketTimeout: exports.WS_REDIS_SOCKET_TIMEOUT_MS,
                enableOfflineQueue: false,
                autoResendUnfulfilledCommands: false,
            });
            const subClient = new ioredis_1.default({
                ...wsRedisOptions(),
                maxRetriesPerRequest: null,
                socketTimeout: exports.WS_REDIS_SUBSCRIBER_SOCKET_TIMEOUT_MS,
            });
            for (const [name, client] of [
                ['pub', pubClient],
                ['sub', subClient],
            ]) {
                client.on('error', err => logger.warn(`Redis ${name} client error: ${err.message}`));
            }
            const publish = pubClient.publish.bind(pubClient);
            let dropping = false;
            let dropped = 0;
            let lastBelowResume = 0;
            pubClient.publish = (channel, message) => {
                const unanswered = unansweredCommands(pubClient);
                const now = performance.now();
                if (unanswered < WS_REDIS_RESUME_UNANSWERED) {
                    lastBelowResume = now;
                    if (dropping) {
                        logger.warn(`Redis caught up; ${dropped} fan-out frames were dropped for the other replicas`);
                        dropping = false;
                        dropped = 0;
                    }
                }
                else if (!dropping &&
                    unanswered >= exports.WS_REDIS_MAX_UNANSWERED &&
                    now - lastBelowResume > exports.WS_REDIS_COMMAND_TIMEOUT_MS) {
                    dropping = true;
                    logger.warn(`Redis has ${unanswered} fan-out frames unanswered; fan-out frames are dropped for the other replicas until it catches up`);
                }
                if (dropping) {
                    dropped++;
                    return Promise.resolve(0);
                }
                return publish(channel, message).catch((err) => {
                    logger.debug(`Redis publish not confirmed: ${err.message}`);
                    return 0;
                });
            };
            this.pubClient = pubClient;
            this.subClient = subClient;
            server.adapter((0, redis_adapter_1.createAdapter)(pubClient, subClient));
            this.subPing = setInterval(() => {
                if (subClient.status === 'ready')
                    subClient.ping().catch(() => undefined);
            }, exports.WS_REDIS_SUBSCRIBER_PING_MS).unref();
            logger.log('WebSocket events fan out across replicas via the Redis adapter');
        }
        catch (error) {
            logger.error('Could not attach the Redis WebSocket adapter; falling back to single-node event delivery. ' +
                'Events raised on other replicas will not reach clients connected here.', error instanceof Error ? error.stack : String(error));
        }
        return server;
    }
    async close(server) {
        clearInterval(this.subPing);
        await super.close(server);
        await Promise.allSettled([this.quitClient(this.pubClient), this.quitClient(this.subClient)]);
        this.pubClient = undefined;
        this.subClient = undefined;
    }
    async quitClient(client) {
        if (!client)
            return;
        let timer;
        const deadline = new Promise(resolve => {
            timer = setTimeout(resolve, exports.WS_REDIS_QUIT_TIMEOUT_MS);
            timer.unref();
        });
        try {
            await Promise.race([client.quit().catch(() => undefined), deadline]);
        }
        finally {
            if (timer)
                clearTimeout(timer);
            client.disconnect();
        }
    }
}
exports.RedisIoAdapter = RedisIoAdapter;
//# sourceMappingURL=redis-io.adapter.js.map