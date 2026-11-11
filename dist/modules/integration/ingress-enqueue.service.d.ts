import { OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JobState, Queue } from 'bullmq';
import { PluginLoaderService } from '../../core/plugins/plugin-loader.service';
import { IngressJobData } from '../queue/processors/ingress.processor';
import { IntegrationDeliveryFailure } from './entities/integration-delivery-failure.entity';
export type EnqueueOutcome = {
    outcome: 'queued' | 'dispatched' | 'failed';
    error?: string;
};
export declare function resolveIngressJobOptions(): {
    attempts: number;
    backoff: {
        type: 'exponential';
        delay: number;
    };
};
export declare function sanitizeIngressJobId(jobId: string, namespace?: string): string;
export declare function requeuedJobIds(baseJobId: string): [string, string];
export declare function buildIngressDeadLetterRow(data: IngressJobData, error?: string): Partial<IntegrationDeliveryFailure>;
export declare class IngressEnqueueService implements OnApplicationBootstrap {
    private readonly loader;
    private readonly config;
    private readonly ingressQueue?;
    private readonly logger;
    constructor(loader: PluginLoaderService, config: ConfigService, ingressQueue?: Queue<IngressJobData> | undefined);
    onApplicationBootstrap(): void;
    defersInlineDispatch(pluginId: string): boolean;
    existingJobState(data: IngressJobData, jobId: string): Promise<JobState | undefined>;
    enqueue(data: IngressJobData, jobId: string, signal?: AbortSignal): Promise<EnqueueOutcome>;
}
