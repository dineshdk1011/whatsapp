import { Repository } from 'typeorm';
import { IngressEvent } from './entities/ingress-event.entity';
import type { EnqueueOutcome } from './ingress-enqueue.service';
export interface IngressEventInput {
    instanceId: string;
    pluginId: string;
    providerDeliveryId: string;
    route: string;
    payload: NonNullable<IngressEvent['payload']>;
    payloadHash: string;
    sessionId: string | null;
}
export interface IngressEventKey {
    pluginId: string;
    instanceId: string;
    providerDeliveryId: string;
}
export declare class IngressEventService {
    private readonly repo;
    constructor(repo: Repository<IngressEvent>);
    recordOrSkip(input: IngressEventInput): Promise<boolean>;
    markDispatchOutcome(key: IngressEventKey, outcome: EnqueueOutcome['outcome']): Promise<void>;
}
