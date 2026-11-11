import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddSessionOwnership1785800000000 implements MigrationInterface {
    name: string;
    private hasColumn;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
