import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Session } from './entities/session.entity';
export declare class SessionAuthDirMigration implements OnModuleInit {
    private readonly sessionRepository;
    private readonly configService;
    private readonly logger;
    constructor(sessionRepository: Repository<Session>, configService: ConfigService);
    onModuleInit(): Promise<void>;
    private migrateBase;
    private warnOnCaseCollisions;
}
