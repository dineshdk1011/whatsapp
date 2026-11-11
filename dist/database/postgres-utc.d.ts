import { ClientBase } from 'pg';
import { DataSource } from 'typeorm';
export declare function parseTimestampAsUtc(value: string): unknown;
export declare const utcTimestampTypes: {
    getTypeParser(oid: number, format?: string): unknown;
};
export interface PostgresSessionSettings {
    statementTimeoutMs?: number;
    searchPath?: string;
}
export declare function postgresUtcExtra(connectionTimeoutMillis?: number, settings?: PostgresSessionSettings): {
    types: typeof utcTimestampTypes;
    onConnect: (client: ClientBase) => Promise<unknown>;
};
export declare function assertDataConnectionUtc(dataSource: DataSource): Promise<void>;
