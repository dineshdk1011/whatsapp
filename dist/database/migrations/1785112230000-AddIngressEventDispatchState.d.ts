import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddIngressEventDispatchState1785112230000 implements MigrationInterface {
    name: string;
    private hasColumn;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
