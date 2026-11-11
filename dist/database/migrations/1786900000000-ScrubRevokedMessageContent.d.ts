import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class ScrubRevokedMessageContent1786900000000 implements MigrationInterface {
    name: string;
    static scrub(queryRunner: QueryRunner): Promise<void>;
    up(queryRunner: QueryRunner): Promise<void>;
    down(): Promise<void>;
}
