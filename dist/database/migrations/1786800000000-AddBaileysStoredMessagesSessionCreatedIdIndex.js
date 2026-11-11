"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddBaileysStoredMessagesSessionCreatedIdIndex1786800000000 = void 0;
class AddBaileysStoredMessagesSessionCreatedIdIndex1786800000000 {
    name = 'AddBaileysStoredMessagesSessionCreatedIdIndex1786800000000';
    async up(queryRunner) {
        if (queryRunner.dataSource.options.type === 'postgres') {
            await queryRunner.query('SET LOCAL statement_timeout = 0');
        }
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_baileys_stored_messages_session_created_id" ON "baileys_stored_messages" ("sessionId", "createdAt", "id")`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_baileys_stored_messages_session_created"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ae44b476c522450bd395615a7c"`);
    }
    async down(queryRunner) {
        if (queryRunner.dataSource.options.type === 'postgres') {
            await queryRunner.query('SET LOCAL statement_timeout = 0');
        }
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_baileys_stored_messages_session_created" ON "baileys_stored_messages" ("sessionId", "createdAt")`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_baileys_stored_messages_session_created_id"`);
    }
}
exports.AddBaileysStoredMessagesSessionCreatedIdIndex1786800000000 = AddBaileysStoredMessagesSessionCreatedIdIndex1786800000000;
//# sourceMappingURL=1786800000000-AddBaileysStoredMessagesSessionCreatedIdIndex.js.map