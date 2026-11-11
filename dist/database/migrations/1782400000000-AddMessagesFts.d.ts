import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddMessagesFts1782400000000 implements MigrationInterface {
    name: string;
    up(qr: QueryRunner): Promise<void>;
    down(qr: QueryRunner): Promise<void>;
}
