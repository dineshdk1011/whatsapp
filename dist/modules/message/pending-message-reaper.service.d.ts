import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { HookManager } from '../../core/hooks';
export interface PendingMessageReaperOptions {
    intervalMs: number;
    graceMs: number;
    batchSize: number;
}
export declare function resolvePendingMessageReaperOptions(env?: NodeJS.ProcessEnv): PendingMessageReaperOptions;
export interface PendingMessageReaperStats {
    scanned: number;
    reaped: number;
    failed: number;
}
export declare class PendingMessageReaperService implements OnModuleInit, OnModuleDestroy {
    private readonly messages;
    private readonly hookManager;
    private readonly logger;
    private timer?;
    private inFlight?;
    private stopping;
    constructor(messages: Repository<Message>, hookManager: HookManager);
    onModuleInit(): void;
    onModuleDestroy(): Promise<void>;
    sweep(opts: PendingMessageReaperOptions, now?: Date): Promise<PendingMessageReaperStats>;
    private reapRow;
}
