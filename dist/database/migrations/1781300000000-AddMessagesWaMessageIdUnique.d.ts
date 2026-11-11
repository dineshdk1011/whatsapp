import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddMessagesWaMessageIdUnique1781300000000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
