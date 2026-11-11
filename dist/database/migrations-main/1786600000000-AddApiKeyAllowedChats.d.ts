import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddApiKeyAllowedChats1786600000000 implements MigrationInterface {
    name: string;
    private hasColumn;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
