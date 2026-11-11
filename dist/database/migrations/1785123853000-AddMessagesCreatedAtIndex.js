"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddMessagesCreatedAtIndex1785123853000 = void 0;
class AddMessagesCreatedAtIndex1785123853000 {
    name = 'AddMessagesCreatedAtIndex1785123853000';
    async up(queryRunner) {
        if (queryRunner.dataSource.options.type === 'postgres') {
            await queryRunner.query('SET LOCAL statement_timeout = 0');
        }
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_messages_createdAt" ON "messages" ("createdAt")`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_messages_createdAt"`);
    }
}
exports.AddMessagesCreatedAtIndex1785123853000 = AddMessagesCreatedAtIndex1785123853000;
//# sourceMappingURL=1785123853000-AddMessagesCreatedAtIndex.js.map