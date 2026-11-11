import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class DropSynchronizeIndexDuplicates1786610000000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(): Promise<void>;
}
