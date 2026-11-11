import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddLidMappingReportSource1791400000000 implements MigrationInterface {
    name: string;
    up(runner: QueryRunner): Promise<void>;
    down(runner: QueryRunner): Promise<void>;
}
