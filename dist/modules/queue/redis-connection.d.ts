import type { Queue } from 'bullmq';
import { type RedisConnectionOptions } from '../../config/redis-options';
export declare const QUEUE_COMMAND_TIMEOUT_MS = 2000;
export declare function queueConnectionOptions(): RedisConnectionOptions & {
    enableOfflineQueue: false;
    commandTimeout: number;
};
export declare function queuePrefix(): string | undefined;
export declare function queueRootOptions(): {
    connection: ReturnType<typeof queueConnectionOptions>;
    prefix?: string;
};
export declare function producerConnectWaitMs(): number;
export declare function producerReady(queue: Pick<Queue, 'waitUntilReady'>): Promise<void>;
export declare function workerConnectionOptions(): RedisConnectionOptions;
export declare function webhookWorkerConcurrency(): number;
export declare function ingressWorkerConcurrency(): number;
