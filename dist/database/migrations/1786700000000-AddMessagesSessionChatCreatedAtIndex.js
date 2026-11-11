"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddMessagesSessionChatCreatedAtIndex1786700000000 = void 0;
class AddMessagesSessionChatCreatedAtIndex1786700000000 {
    name = 'AddMessagesSessionChatCreatedAtIndex1786700000000';
    async up(queryRunner) {
        if (queryRunner.dataSource.options.type === 'postgres') {
            await queryRunner.query('SET LOCAL statement_timeout = 0');
        }
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_messages_sessionId_chatId_createdAt" ON "messages" ("sessionId", "chatId", "createdAt")`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_messages_sessionId_chatId_createdAt"`);
    }
}
exports.AddMessagesSessionChatCreatedAtIndex1786700000000 = AddMessagesSessionChatCreatedAtIndex1786700000000;
//# sourceMappingURL=1786700000000-AddMessagesSessionChatCreatedAtIndex.js.map