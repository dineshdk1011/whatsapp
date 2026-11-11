import type { MigrationTables, WebhookDeliveryFailureRow } from './migration-tables.types';
export interface TableImporter<K extends keyof MigrationTables = keyof MigrationTables> {
    key: K;
    label: string;
    sql: string;
    id: (row: MigrationTables[K][number]) => string;
    map: (row: MigrationTables[K][number]) => unknown[];
    skip?: (row: MigrationTables[K][number], rows?: MigrationTables[K]) => string | null;
}
export type AnyTableImporter = Omit<TableImporter, 'id' | 'map' | 'skip'> & {
    id: (row: never) => string;
    map: (row: never) => unknown[];
    skip?: (row: never, rows?: never) => string | null;
};
export declare function deduplicateArchivedWebhookFailures(rows: WebhookDeliveryFailureRow[]): WebhookDeliveryFailureRow[];
export declare const TABLE_IMPORTERS: AnyTableImporter[];
