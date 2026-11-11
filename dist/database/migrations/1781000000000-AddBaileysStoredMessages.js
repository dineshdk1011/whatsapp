"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddBaileysStoredMessages1781000000000 = void 0;
class AddBaileysStoredMessages1781000000000 {
    name = 'AddBaileysStoredMessages1781000000000';
    async up(queryRunner) {
        if (await queryRunner.hasTable('baileys_stored_messages'))
            return;
        const isPostgres = queryRunner.dataSource.options.type === 'postgres';
        if (isPostgres) {
            await queryRunner.query(`CREATE TABLE "baileys_stored_messages" ("id" varchar PRIMARY KEY NOT NULL DEFAULT gen_random_uuid()::varchar, "sessionId" varchar NOT NULL, "waMessageId" varchar NOT NULL, "serializedMessage" text NOT NULL, "createdAt" timestamp NOT NULL DEFAULT NOW(), CONSTRAINT "FK_baileys_stored_messages_sessionId" FOREIGN KEY ("sessionId") REFERENCES "sessions" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        }
        else {
            await queryRunner.query(`CREATE TABLE "baileys_stored_messages" ("id" varchar PRIMARY KEY NOT NULL, "sessionId" varchar NOT NULL, "waMessageId" varchar NOT NULL, "serializedMessage" text NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_baileys_stored_messages_sessionId" FOREIGN KEY ("sessionId") REFERENCES "sessions" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        }
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_baileys_stored_messages_session_wamsg" ON "baileys_stored_messages" ("sessionId", "waMessageId")`);
        await queryRunner.query(`CREATE INDEX "IDX_baileys_stored_messages_session_created" ON "baileys_stored_messages" ("sessionId", "createdAt")`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_baileys_stored_messages_session_created"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "UQ_baileys_stored_messages_session_wamsg"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "baileys_stored_messages"`);
    }
}
exports.AddBaileysStoredMessages1781000000000 = AddBaileysStoredMessages1781000000000;
//# sourceMappingURL=1781000000000-AddBaileysStoredMessages.js.map