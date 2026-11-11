import type { WorkerHost } from '@nestjs/bullmq';
import type { Worker } from 'bullmq';
export declare const MAX_WORKER_CLOSE_WAIT_MS = 10000;
export declare function startedWorker(host: WorkerHost): Worker | undefined;
export declare function closeWorkerIfStarted(host: WorkerHost, waitMs: number): Promise<void>;
