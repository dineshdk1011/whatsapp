import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddWebhookDeliveryFailures1781700000000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
