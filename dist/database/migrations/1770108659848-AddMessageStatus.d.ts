import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddMessageStatus1770108659848 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
    private upSqlite;
    private downSqlite;
    private upPostgres;
    private downPostgres;
}
