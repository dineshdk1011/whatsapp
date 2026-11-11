import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddMessageAuthor1784908800000 implements MigrationInterface {
    name: string;
    private hasAuthorColumn;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
