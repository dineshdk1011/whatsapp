import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class ReKeyChatStatesBySessionId1786500000000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
    static rekey(from: 'name' | 'id', to: 'name' | 'id', opts?: {
        skipAlreadyKeyed?: boolean;
    }): string;
}
