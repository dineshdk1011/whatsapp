import { type FindOptionsWhere, type Repository } from 'typeorm';
import { Message } from './entities/message.entity';
export declare function updateMessageMetadata(repository: Repository<Message>, where: FindOptionsWhere<Message>, change: (metadata: Record<string, unknown>) => Record<string, unknown>): Promise<Record<string, unknown> | null>;
export declare function mergeSentMetadata(current: Record<string, unknown>, incoming: Record<string, unknown>): Record<string, unknown>;
