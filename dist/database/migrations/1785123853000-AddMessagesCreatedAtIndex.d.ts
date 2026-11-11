import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddMessagesCreatedAtIndex1785123853000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
