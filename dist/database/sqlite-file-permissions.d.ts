import { OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare function tightenSqliteFilePermissions(paths: string[], warn: (message: string) => void): string[];
export declare class SqlitePermissionsBoot implements OnApplicationBootstrap {
    private readonly config;
    private readonly logger;
    constructor(config: ConfigService);
    onApplicationBootstrap(): void;
}
