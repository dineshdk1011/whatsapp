import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { MessageBatch } from './entities/message-batch.entity';
export declare const MAX_MESSAGE_RETENTION_DAYS = 36500;
export declare function resolveMessageRetentionDays(env?: NodeJS.ProcessEnv): number;
export declare function resolveMessageRetentionCutoff(now?: Date, env?: NodeJS.ProcessEnv): Date | undefined;
export declare class MessageRetentionService implements OnModuleInit, OnModuleDestroy {
    private readonly messages;
    private readonly batches;
    private readonly logger;
    private timer?;
    private followUp?;
    private stopped;
    private running;
    constructor(messages: Repository<Message>, batches: Repository<MessageBatch>);
    onModuleInit(): void;
    onModuleDestroy(): void;
    prune(now?: Date): Promise<{
        messages: number;
        batches: number;
    }>;
}
