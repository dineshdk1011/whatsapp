import { Queue } from 'bullmq';
export declare const QUEUE_CLOSE_TIMEOUT_MS = 2000;
export declare class ShutdownSafeQueue extends Queue {
    close(): Promise<void>;
}
