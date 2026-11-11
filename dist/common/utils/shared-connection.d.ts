import type { DataSource } from 'typeorm';
export declare const SHARED_CONNECTION_DIALECTS: Set<string>;
export declare const FOREIGN_TRANSACTION_WAIT_MS = 10000;
export declare function awaitNoOpenTransaction(dataSource: DataSource, boundMs?: number): Promise<boolean>;
