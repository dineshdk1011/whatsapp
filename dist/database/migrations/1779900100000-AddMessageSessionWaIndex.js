"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddMessageSessionWaIndex1779900100000 = void 0;
class AddMessageSessionWaIndex1779900100000 {
    name = 'AddMessageSessionWaIndex1779900100000';
    async up(queryRunner) {
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_messages_sessionId_waMessageId" ON "messages" ("sessionId", "waMessageId")`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_messages_sessionId_waMessageId"`);
    }
}
exports.AddMessageSessionWaIndex1779900100000 = AddMessageSessionWaIndex1779900100000;
//# sourceMappingURL=1779900100000-AddMessageSessionWaIndex.js.map