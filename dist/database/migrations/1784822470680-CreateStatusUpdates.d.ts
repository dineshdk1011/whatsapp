import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class CreateStatusUpdates1784822470680 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
