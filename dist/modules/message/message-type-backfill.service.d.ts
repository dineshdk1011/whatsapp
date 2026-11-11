import { OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
export declare class MessageTypeBackfillService implements OnApplicationBootstrap {
    private readonly messageRepository;
    private readonly configService?;
    private readonly logger;
    constructor(messageRepository: Repository<Message>, configService?: ConfigService | undefined);
    onApplicationBootstrap(): Promise<void>;
}
