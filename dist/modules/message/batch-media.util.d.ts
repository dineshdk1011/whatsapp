import { DataSource } from 'typeorm';
import { MessageBatch } from './entities/message-batch.entity';
export declare function stripBatchMediaPayloads(messages: MessageBatch['messages']): void;
export declare function failUnfinishedSessionBatches(dataSource: Pick<DataSource, 'getRepository'>, sessionId: string): Promise<void>;
