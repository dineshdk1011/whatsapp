import { OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { Repository } from 'typeorm';
import type { IncomingHttpHeaders } from 'http';
import { ApiKey } from './entities/api-key.entity';
export declare class ActiveKeyIndex implements OnApplicationBootstrap, OnModuleDestroy {
    private readonly apiKeyRepository;
    private readonly logger;
    private keys;
    private timer;
    private loading;
    private reloadAgain;
    private destroyed;
    constructor(apiKeyRepository: Repository<ApiKey>);
    onApplicationBootstrap(): Promise<void>;
    onModuleDestroy(): void;
    refreshSoon(): void;
    recognise(headers: IncomingHttpHeaders, clientIp: string): string | undefined;
    private load;
}
