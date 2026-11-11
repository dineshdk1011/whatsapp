"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddMessagesWaMessageIdUnique1781300000000 = void 0;
class AddMessagesWaMessageIdUnique1781300000000 {
    name = 'AddMessagesWaMessageIdUnique1781300000000';
    async up(queryRunner) {
        if (queryRunner.dataSource.options.type === 'postgres') {
            await queryRunner.query('SET LOCAL statement_timeout = 0');
        }
        if (!(await queryRunner.hasTable('messages')))
            return;
        await queryRunner.query(`DELETE FROM "messages" WHERE "waMessageId" IS NOT NULL AND "id" <> (` +
            `SELECT m2."id" FROM "messages" m2 ` +
            `WHERE m2."sessionId" = "messages"."sessionId" AND m2."waMessageId" = "messages"."waMessageId" ` +
            `ORDER BY m2."createdAt" ASC, m2."id" ASC LIMIT 1)`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_messages_sessionId_waMessageId"`);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_messages_sessionId_waMessageId" ON "messages" ("sessionId", "waMessageId")`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS "UQ_messages_sessionId_waMessageId"`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_messages_sessionId_waMessageId" ON "messages" ("sessionId", "waMessageId")`);
    }
}
exports.AddMessagesWaMessageIdUnique1781300000000 = AddMessagesWaMessageIdUnique1781300000000;
//# sourceMappingURL=1781300000000-AddMessagesWaMessageIdUnique.js.map