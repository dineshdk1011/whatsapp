"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddMessagesFts1782400000000 = void 0;
class AddMessagesFts1782400000000 {
    name = 'AddMessagesFts1782400000000';
    async up(qr) {
        const isPostgres = qr.dataSource.options.type === 'postgres';
        if (isPostgres) {
            await qr.query('SET LOCAL statement_timeout = 0');
            await qr.query(`ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "body_ts" tsvector GENERATED ALWAYS AS (to_tsvector('simple', coalesce(body, ''))) STORED`);
            await qr.query(`CREATE INDEX IF NOT EXISTS "idx_messages_body_ts" ON "messages" USING GIN ("body_ts")`);
            return;
        }
        const fts5 = (await qr.query(`SELECT sqlite_compileoption_used('ENABLE_FTS5') AS enabled`));
        if (!Number(fts5?.[0]?.enabled)) {
            return;
        }
        await qr.query(`CREATE VIRTUAL TABLE IF NOT EXISTS "messages_fts" USING fts5(body, content='messages', content_rowid='rowid')`);
        await qr.query(`INSERT INTO "messages_fts"("rowid", "body") SELECT "rowid", "body" FROM "messages" WHERE "body" IS NOT NULL`);
        await qr.query(`DROP TRIGGER IF EXISTS messages_fts_ai`);
        await qr.query(`CREATE TRIGGER messages_fts_ai AFTER INSERT ON "messages" BEGIN
      INSERT INTO "messages_fts"("rowid", "body") VALUES (new."rowid", new."body");
    END`);
        await qr.query(`DROP TRIGGER IF EXISTS messages_fts_ad`);
        await qr.query(`CREATE TRIGGER messages_fts_ad AFTER DELETE ON "messages" BEGIN
      INSERT INTO "messages_fts"("messages_fts", "rowid", "body") VALUES ('delete', old."rowid", old."body");
    END`);
        await qr.query(`DROP TRIGGER IF EXISTS messages_fts_au`);
        await qr.query(`CREATE TRIGGER messages_fts_au AFTER UPDATE ON "messages" WHEN OLD.body IS NOT NEW.body BEGIN
      INSERT INTO "messages_fts"("messages_fts", "rowid", "body") VALUES ('delete', old."rowid", old."body");
      INSERT INTO "messages_fts"("rowid", "body") VALUES (new."rowid", new."body");
    END`);
    }
    async down(qr) {
        const isPostgres = qr.dataSource.options.type === 'postgres';
        if (isPostgres) {
            await qr.query(`DROP INDEX IF EXISTS "idx_messages_body_ts"`);
            await qr.query(`ALTER TABLE "messages" DROP COLUMN IF EXISTS "body_ts"`);
            return;
        }
        await qr.query(`DROP TRIGGER IF EXISTS messages_fts_au`);
        await qr.query(`DROP TRIGGER IF EXISTS messages_fts_ad`);
        await qr.query(`DROP TRIGGER IF EXISTS messages_fts_ai`);
        await qr.query(`DROP TABLE IF EXISTS "messages_fts"`);
    }
}
exports.AddMessagesFts1782400000000 = AddMessagesFts1782400000000;
//# sourceMappingURL=1782400000000-AddMessagesFts.js.map