import type { ConfigService } from '@nestjs/config';
import { DataSource, type DataSourceOptions } from 'typeorm';
export declare class MainSchemaMismatchError extends Error {
    constructor(message: string);
}
export declare const SQLITE_BUSY_TIMEOUT_MS = 30000;
export declare const retryMainConnection: (err: unknown) => boolean;
export declare function mainConnectionOptions(configService: ConfigService): DataSourceOptions & {
    name: string;
    toRetry: (err: unknown) => boolean;
};
export declare function createMainDataSource(options?: DataSourceOptions): Promise<DataSource>;
