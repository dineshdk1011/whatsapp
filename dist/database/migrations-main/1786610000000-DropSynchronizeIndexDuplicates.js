"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DropSynchronizeIndexDuplicates1786610000000 = void 0;
class DropSynchronizeIndexDuplicates1786610000000 {
    name = 'DropSynchronizeIndexDuplicates1786610000000';
    async up(queryRunner) {
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_api_keys_keyHash" ON "api_keys" ("keyHash")`);
        for (const column of ['action', 'apiKeyId', 'sessionId', 'createdAt']) {
            await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_audit_logs_${column}" ON "audit_logs" ("${column}")`);
        }
        for (const index of [
            'IDX_df3b25181df0b4b59bd93f16e1',
            'IDX_cee5459245f652b75eb2759b4c',
            'IDX_741fa976d1e04e695f3aa23cb8',
            'IDX_dd2b6e43c767b6b5b2bb227ace',
            'IDX_c69efb19bf127c97e6740ad530',
        ]) {
            await queryRunner.query(`DROP INDEX IF EXISTS "${index}"`);
        }
    }
    async down() {
    }
}
exports.DropSynchronizeIndexDuplicates1786610000000 = DropSynchronizeIndexDuplicates1786610000000;
//# sourceMappingURL=1786610000000-DropSynchronizeIndexDuplicates.js.map