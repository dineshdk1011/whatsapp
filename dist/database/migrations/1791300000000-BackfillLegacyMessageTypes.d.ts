import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class BackfillLegacyMessageTypes1791300000000 implements MigrationInterface {
    name: string;
    static backfill(queryRunner: QueryRunner): Promise<void>;
    up(queryRunner: QueryRunner): Promise<void>;
    down(): Promise<void>;
}
