import type { MigrationTables } from '../migration-tables.types';
export declare class ImportDataDto {
    tables: Partial<MigrationTables>;
    force?: boolean;
    stopOrphans?: boolean;
    exportedAt?: unknown;
    dataDbType?: unknown;
    counts?: unknown;
    skippedTables?: unknown;
    omittedInlineMedia?: unknown;
}
