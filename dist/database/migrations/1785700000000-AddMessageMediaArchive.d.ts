import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddMessageMediaArchive1785700000000 implements MigrationInterface {
    name: string;
    private hasColumn;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
