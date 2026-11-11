import type { ConnectionOptions as TlsOptions } from 'node:tls';
export interface RedisConnectionOptions {
    host: string;
    port: number;
    username?: string;
    password?: string;
    connectTimeout: number;
    tls?: TlsOptions;
}
export declare const DEFAULT_REDIS_CONNECT_TIMEOUT_MS = 5000;
export declare function redisConnectionOptions(): RedisConnectionOptions;
