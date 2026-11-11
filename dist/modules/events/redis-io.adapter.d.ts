import { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { type RedisOptions } from 'ioredis';
import type { Server, ServerOptions } from 'socket.io';
export declare const WS_REDIS_QUIT_TIMEOUT_MS = 2000;
export declare const WS_REDIS_COMMAND_TIMEOUT_MS = 2000;
export declare const WS_REDIS_SOCKET_TIMEOUT_MS = 10000;
export declare const WS_REDIS_SUBSCRIBER_PING_MS = 15000;
export declare const WS_REDIS_SUBSCRIBER_SOCKET_TIMEOUT_MS = 30000;
export declare const WS_REDIS_MAX_UNANSWERED = 12000;
export declare function isWsRedisEnabled(): boolean;
export declare function wsRedisOptions(): RedisOptions;
export declare function rejectRootNamespace(server: Server): void;
export declare class RedisIoAdapter extends IoAdapter {
    private pubClient?;
    private subClient?;
    private subPing?;
    constructor(app: INestApplicationContext);
    createIOServer(port: number, options?: ServerOptions): Server;
    close(server: Server): Promise<void>;
    private quitClient;
}
