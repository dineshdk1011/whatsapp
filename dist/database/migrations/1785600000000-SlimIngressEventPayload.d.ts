import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class SlimIngressEventPayload1785600000000 implements MigrationInterface {
    name: string;
    private hasColumn;
    private isPayloadNullable;
    private retireNonPendingPayloads;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
