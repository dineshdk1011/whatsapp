import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class RepairSqliteMessageFts1791600000000 implements MigrationInterface {
    name: string;
    up(runner: QueryRunner): Promise<void>;
    down(): Promise<void>;
}
