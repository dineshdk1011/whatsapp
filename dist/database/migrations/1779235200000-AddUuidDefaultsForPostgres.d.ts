import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddUuidDefaultsForPostgres1779235200000 implements MigrationInterface {
    name: string;
    private readonly tables;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
