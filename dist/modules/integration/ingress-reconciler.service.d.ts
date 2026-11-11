import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { IngressEvent } from './entities/ingress-event.entity';
import { IntegrationDeliveryFailure } from './entities/integration-delivery-failure.entity';
import { IngressEnqueueService } from './ingress-enqueue.service';
import { PluginInstanceService } from './plugin-instance.service';
import { PluginLoaderService } from '../../core/plugins/plugin-loader.service';
export interface IngressReconcilerOptions {
    intervalMs: number;
    graceMs: number;
    batchSize: number;
    maxAttempts: number;
}
export declare function resolveIngressReconcilerOptions(env?: NodeJS.ProcessEnv): IngressReconcilerOptions;
export interface IngressReconcileStats {
    scanned: number;
    replayed: number;
    failed: number;
    skipped: number;
}
export declare class IngressReconcilerService implements OnModuleInit, OnModuleDestroy {
    private readonly events;
    private readonly failures;
    private readonly ingressEnqueue;
    private readonly loader;
    private readonly instances;
    private readonly logger;
    private timer?;
    private inFlight?;
    private readonly stop;
    private readonly unreadableUntil;
    constructor(events: Repository<IngressEvent>, failures: Repository<IntegrationDeliveryFailure>, ingressEnqueue: IngressEnqueueService, loader: PluginLoaderService, instances: PluginInstanceService);
    onModuleInit(): void;
    onModuleDestroy(): Promise<void>;
    sweep(opts: IngressReconcilerOptions, now?: Date): Promise<IngressReconcileStats>;
    private unreadableRows;
    private rememberUnreadable;
    deadLetterAgedPending(cutoff: Date, batchSize?: number): Promise<number>;
    private ownerDeleted;
    private settleDeadLetter;
    private hasOpenDeadLetter;
    private retireOpenDeadLetters;
    private reconcileRow;
    private settledElsewhere;
    private jobDataFor;
    private ensureDeadLetterRow;
}
