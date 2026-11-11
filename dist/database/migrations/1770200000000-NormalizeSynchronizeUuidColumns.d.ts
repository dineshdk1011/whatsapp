import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class NormalizeSynchronizeUuidColumns1770200000000 implements MigrationInterface {
    name: string;
    private readonly uuidPkTables;
    private readonly sessionFks;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
    private columnIsUuid;
    private fkConstraintNames;
    private ensureGenRandomUuid;
}
