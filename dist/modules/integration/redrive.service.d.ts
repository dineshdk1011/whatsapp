import { OnModuleDestroy } from '@nestjs/common';
import { Repository } from 'typeorm';
import { IntegrationDeliveryFailure } from './entities/integration-delivery-failure.entity';
import { IngressEvent } from './entities/ingress-event.entity';
import { IngressEnqueueService } from './ingress-enqueue.service';
export declare class RedriveService implements OnModuleDestroy {
    private readonly repo;
    private readonly events;
    private readonly ingressEnqueue;
    private readonly logger;
    private readonly lock;
    private readonly stop;
    private readonly inFlight;
    constructor(repo: Repository<IntegrationDeliveryFailure>, events: Repository<IngressEvent>, ingressEnqueue: IngressEnqueueService);
    onModuleDestroy(): Promise<void>;
    redriveInstance(pluginId: string, instanceId: string, sessionScope: string | null): Promise<{
        redriven: number;
        remaining: number;
        batchSize: number;
    }>;
    private redriveBatch;
}
