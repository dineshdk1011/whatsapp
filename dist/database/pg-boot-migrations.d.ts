import { ClientConfig } from 'pg';
import { DataSource, DataSourceOptions } from 'typeorm';
export declare const POSTGRES_BOOT_MIGRATION_LOCK_KEYS: readonly [number, number];
export interface AdvisoryLockClient {
    connect: () => Promise<unknown>;
    query: (text: string, values?: unknown[]) => Promise<unknown>;
    end: () => Promise<unknown>;
}
export interface BootDataSourceDeps {
    createDataSource?: (options: DataSourceOptions) => DataSource;
    createLockClient?: (config: ClientConfig, onLost: (error: Error) => void) => AdvisoryLockClient;
}
export declare function createBootDataSource(options: DataSourceOptions | undefined, deps?: BootDataSourceDeps): Promise<DataSource>;
