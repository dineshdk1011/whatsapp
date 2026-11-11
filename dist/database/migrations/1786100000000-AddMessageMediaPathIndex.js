"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddMessageMediaPathIndex1786100000000 = void 0;
class AddMessageMediaPathIndex1786100000000 {
    name = 'AddMessageMediaPathIndex1786100000000';
    async up(queryRunner) {
        if (queryRunner.dataSource.options.type === 'postgres') {
            await queryRunner.query('SET LOCAL statement_timeout = 0');
        }
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_messages_mediaPath" ON "messages" ("mediaPath") WHERE "mediaPath" IS NOT NULL`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_messages_mediaPath"`);
    }
}
exports.AddMessageMediaPathIndex1786100000000 = AddMessageMediaPathIndex1786100000000;
//# sourceMappingURL=1786100000000-AddMessageMediaPathIndex.js.map