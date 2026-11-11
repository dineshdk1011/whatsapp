import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddWebhooksSessionIdIndex1782200000000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
