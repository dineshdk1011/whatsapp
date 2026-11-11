import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddBaileysStoredMessages1781000000000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
