import { WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { IntegrationDeliveryFailure } from '../../integration/entities/integration-delivery-failure.entity';
import { IngressEvent } from '../../integration/entities/ingress-event.entity';
import { PluginLoaderService } from '../../../core/plugins/plugin-loader.service';
import { HookManager } from '../../../core/hooks';
import { ShutdownService } from '../../../common/services/shutdown.service';
export interface IngressJobData {
    pluginId: string;
    instanceId: string;
    route: string;
    method?: string;
    deliveryId: string;
    sessionId?: string;
    providerConversationId?: string;
    payload: {
        headers: Record<string, string>;
        query: Record<string, string>;
        body: string;
        rawBody: string;
        admission?: {
            verified: boolean;
        };
    };
}
export declare class IngressProcessor extends WorkerHost {
    private readonly loader;
    private readonly failures;
    private readonly hooks;
    private readonly ingressQueue;
    private readonly events;
    private readonly logger;
    private readonly lock;
    constructor(loader: PluginLoaderService, failures: Repository<IntegrationDeliveryFailure>, hooks: HookManager, ingressQueue: Queue<IngressJobData>, events: Repository<IngressEvent>, shutdown?: ShutdownService);
    onModuleDestroy(): Promise<void>;
    process(job: Job<IngressJobData>, token?: string): Promise<void>;
    private settleRequeued;
    onWorkerFailed(job: Job<IngressJobData> | undefined, error: Error): Promise<void>;
    private deadLetterOrRequeue;
    private deadLetter;
}
