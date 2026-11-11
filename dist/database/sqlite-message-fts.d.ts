export declare function repairSqliteMessageFts(database: {
    query(sql: string): Promise<unknown>;
}): Promise<void>;
