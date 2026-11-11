import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class ScrubNonPhoneLidMappings1786950000000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    static scrub(queryRunner: QueryRunner): Promise<void>;
    down(): Promise<void>;
}
