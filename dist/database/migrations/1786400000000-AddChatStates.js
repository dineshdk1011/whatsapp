"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddChatStates1786400000000 = void 0;
class AddChatStates1786400000000 {
    name = 'AddChatStates1786400000000';
    async up(queryRunner) {
        if (await queryRunner.hasTable('chat_states'))
            return;
        const isPostgres = queryRunner.dataSource.options.type === 'postgres';
        if (isPostgres) {
            await queryRunner.query(`CREATE TABLE "chat_states" ("sessionId" varchar NOT NULL, "chatId" varchar NOT NULL, "muteEndTime" bigint, "archived" boolean NOT NULL DEFAULT false, "pinned" boolean NOT NULL DEFAULT false, "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), PRIMARY KEY ("sessionId", "chatId"))`);
        }
        else {
            await queryRunner.query(`CREATE TABLE "chat_states" ("sessionId" varchar NOT NULL, "chatId" varchar NOT NULL, "muteEndTime" bigint, "archived" boolean NOT NULL DEFAULT (0), "pinned" boolean NOT NULL DEFAULT (0), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), PRIMARY KEY ("sessionId", "chatId"))`);
        }
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS "chat_states"`);
    }
}
exports.AddChatStates1786400000000 = AddChatStates1786400000000;
//# sourceMappingURL=1786400000000-AddChatStates.js.map