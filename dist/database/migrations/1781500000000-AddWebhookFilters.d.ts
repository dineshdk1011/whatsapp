import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddWebhookFilters1781500000000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
