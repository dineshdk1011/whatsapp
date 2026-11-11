import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class ScopeBatchIdUniqueToSession1781800000000 implements MigrationInterface {
    name: string;
    private static readonly TABLE;
    private static readonly COMPOSITE;
    private static readonly GLOBAL;
    private isGlobal;
    private isComposite;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
