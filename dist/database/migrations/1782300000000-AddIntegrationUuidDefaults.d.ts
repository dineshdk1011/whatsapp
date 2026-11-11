import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddIntegrationUuidDefaults1782300000000 implements MigrationInterface {
    name: string;
    private readonly tables;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
