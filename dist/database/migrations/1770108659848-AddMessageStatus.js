"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddMessageStatus1770108659848 = void 0;
class AddMessageStatus1770108659848 {
    name = 'AddMessageStatus1770108659848';
    async up(queryRunner) {
        if (await queryRunner.hasTable('sessions')) {
            return;
        }
        const isPostgres = queryRunner.dataSource.options.type === 'postgres';
        if (isPostgres) {
            await this.upPostgres(queryRunner);
        }
        else {
            await this.upSqlite(queryRunner);
        }
    }
    async down(queryRunner) {
        const isPostgres = queryRunner.dataSource.options.type === 'postgres';
        if (isPostgres) {
            await this.downPostgres(queryRunner);
        }
        else {
            await this.downSqlite(queryRunner);
        }
    }
    async upSqlite(queryRunner) {
        await queryRunner.query(`CREATE TABLE "sessions" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar(100) NOT NULL, "status" varchar(50) NOT NULL DEFAULT ('created'), "phone" varchar(20), "pushName" varchar(100), "config" text NOT NULL DEFAULT ('{}'), "proxyUrl" varchar(255), "proxyType" varchar(10), "connectedAt" datetime, "lastActiveAt" datetime, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_ac984ccbd8b01af155e1874e8cb" UNIQUE ("name"))`);
        await queryRunner.query(`CREATE TABLE "webhooks" ("id" varchar PRIMARY KEY NOT NULL, "sessionId" varchar NOT NULL, "url" varchar(2048) NOT NULL, "events" text NOT NULL DEFAULT ('["message.received"]'), "secret" varchar(255), "headers" text NOT NULL DEFAULT ('{}'), "active" boolean NOT NULL DEFAULT (1), "retryCount" integer NOT NULL DEFAULT (3), "lastTriggeredAt" datetime, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`CREATE TABLE "messages" ("id" varchar PRIMARY KEY NOT NULL, "sessionId" varchar NOT NULL, "waMessageId" varchar, "chatId" varchar NOT NULL, "from" varchar NOT NULL, "to" varchar NOT NULL, "body" text, "type" varchar NOT NULL DEFAULT ('text'), "direction" varchar NOT NULL DEFAULT ('outgoing'), "timestamp" bigint, "metadata" text, "status" varchar NOT NULL DEFAULT ('sent'), "createdAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`CREATE INDEX "IDX_066163c46cda7e8187f96bc87a" ON "messages" ("sessionId") `);
        await queryRunner.query(`CREATE INDEX "IDX_befd307485dbf0559d17e4a4d2" ON "messages" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_36bc604c820bb9adc4c75cd411" ON "messages" ("chatId") `);
        await queryRunner.query(`CREATE INDEX "IDX_399833392126349ef0b04b9bed" ON "messages" ("sessionId", "createdAt") `);
        await queryRunner.query(`CREATE TABLE "message_batches" ("id" varchar PRIMARY KEY NOT NULL, "batch_id" varchar NOT NULL, "session_id" varchar NOT NULL, "status" varchar NOT NULL DEFAULT ('pending'), "messages" text NOT NULL, "options" text, "progress" text, "results" text, "current_index" integer NOT NULL DEFAULT (0), "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime NOT NULL DEFAULT (datetime('now')), "started_at" datetime, "completed_at" datetime, CONSTRAINT "UQ_ff274470c0dbaff6c7d1f9795f5" UNIQUE ("batch_id"))`);
        await queryRunner.query(`CREATE TABLE "temporary_webhooks" ("id" varchar PRIMARY KEY NOT NULL, "sessionId" varchar NOT NULL, "url" varchar(2048) NOT NULL, "events" text NOT NULL DEFAULT ('["message.received"]'), "secret" varchar(255), "headers" text NOT NULL DEFAULT ('{}'), "active" boolean NOT NULL DEFAULT (1), "retryCount" integer NOT NULL DEFAULT (3), "lastTriggeredAt" datetime, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_d209715bb62b12255e825580af6" FOREIGN KEY ("sessionId") REFERENCES "sessions" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_webhooks"("id", "sessionId", "url", "events", "secret", "headers", "active", "retryCount", "lastTriggeredAt", "createdAt", "updatedAt") SELECT "id", "sessionId", "url", "events", "secret", "headers", "active", "retryCount", "lastTriggeredAt", "createdAt", "updatedAt" FROM "webhooks"`);
        await queryRunner.query(`DROP TABLE "webhooks"`);
        await queryRunner.query(`ALTER TABLE "temporary_webhooks" RENAME TO "webhooks"`);
    }
    async downSqlite(queryRunner) {
        await queryRunner.query(`ALTER TABLE "webhooks" RENAME TO "temporary_webhooks"`);
        await queryRunner.query(`CREATE TABLE "webhooks" ("id" varchar PRIMARY KEY NOT NULL, "sessionId" varchar NOT NULL, "url" varchar(2048) NOT NULL, "events" text NOT NULL DEFAULT ('["message.received"]'), "secret" varchar(255), "headers" text NOT NULL DEFAULT ('{}'), "active" boolean NOT NULL DEFAULT (1), "retryCount" integer NOT NULL DEFAULT (3), "lastTriggeredAt" datetime, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`INSERT INTO "webhooks"("id", "sessionId", "url", "events", "secret", "headers", "active", "retryCount", "lastTriggeredAt", "createdAt", "updatedAt") SELECT "id", "sessionId", "url", "events", "secret", "headers", "active", "retryCount", "lastTriggeredAt", "createdAt", "updatedAt" FROM "temporary_webhooks"`);
        await queryRunner.query(`DROP TABLE "temporary_webhooks"`);
        await queryRunner.query(`DROP TABLE "message_batches"`);
        await queryRunner.query(`DROP INDEX "IDX_399833392126349ef0b04b9bed"`);
        await queryRunner.query(`DROP INDEX "IDX_36bc604c820bb9adc4c75cd411"`);
        await queryRunner.query(`DROP INDEX "IDX_befd307485dbf0559d17e4a4d2"`);
        await queryRunner.query(`DROP INDEX "IDX_066163c46cda7e8187f96bc87a"`);
        await queryRunner.query(`DROP TABLE "messages"`);
        await queryRunner.query(`DROP TABLE "webhooks"`);
        await queryRunner.query(`DROP TABLE "sessions"`);
    }
    async upPostgres(queryRunner) {
        await queryRunner.query(`CREATE TABLE "sessions" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar(100) NOT NULL, "status" varchar(50) NOT NULL DEFAULT 'created', "phone" varchar(20), "pushName" varchar(100), "config" text NOT NULL DEFAULT '{}', "proxyUrl" varchar(255), "proxyType" varchar(10), "connectedAt" timestamp, "lastActiveAt" timestamp, "createdAt" timestamp NOT NULL DEFAULT NOW(), "updatedAt" timestamp NOT NULL DEFAULT NOW(), CONSTRAINT "UQ_ac984ccbd8b01af155e1874e8cb" UNIQUE ("name"))`);
        await queryRunner.query(`CREATE TABLE "webhooks" ("id" varchar PRIMARY KEY NOT NULL, "sessionId" varchar NOT NULL, "url" varchar(2048) NOT NULL, "events" text NOT NULL DEFAULT '["message.received"]', "secret" varchar(255), "headers" text NOT NULL DEFAULT '{}', "active" boolean NOT NULL DEFAULT true, "retryCount" integer NOT NULL DEFAULT 3, "lastTriggeredAt" timestamp, "createdAt" timestamp NOT NULL DEFAULT NOW(), "updatedAt" timestamp NOT NULL DEFAULT NOW(), CONSTRAINT "FK_d209715bb62b12255e825580af6" FOREIGN KEY ("sessionId") REFERENCES "sessions" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`CREATE TABLE "messages" ("id" varchar PRIMARY KEY NOT NULL, "sessionId" varchar NOT NULL, "waMessageId" varchar, "chatId" varchar NOT NULL, "from" varchar NOT NULL, "to" varchar NOT NULL, "body" text, "type" varchar NOT NULL DEFAULT 'text', "direction" varchar NOT NULL DEFAULT 'outgoing', "timestamp" bigint, "metadata" text, "status" varchar NOT NULL DEFAULT 'sent', "createdAt" timestamp NOT NULL DEFAULT NOW())`);
        await queryRunner.query(`CREATE INDEX "IDX_066163c46cda7e8187f96bc87a" ON "messages" ("sessionId")`);
        await queryRunner.query(`CREATE INDEX "IDX_befd307485dbf0559d17e4a4d2" ON "messages" ("status")`);
        await queryRunner.query(`CREATE INDEX "IDX_36bc604c820bb9adc4c75cd411" ON "messages" ("chatId")`);
        await queryRunner.query(`CREATE INDEX "IDX_399833392126349ef0b04b9bed" ON "messages" ("sessionId", "createdAt")`);
        await queryRunner.query(`CREATE TABLE "message_batches" ("id" varchar PRIMARY KEY NOT NULL, "batch_id" varchar NOT NULL, "session_id" varchar NOT NULL, "status" varchar NOT NULL DEFAULT 'pending', "messages" text NOT NULL, "options" text, "progress" text, "results" text, "current_index" integer NOT NULL DEFAULT 0, "created_at" timestamp NOT NULL DEFAULT NOW(), "updated_at" timestamp NOT NULL DEFAULT NOW(), "started_at" timestamp, "completed_at" timestamp, CONSTRAINT "UQ_ff274470c0dbaff6c7d1f9795f5" UNIQUE ("batch_id"))`);
    }
    async downPostgres(queryRunner) {
        await queryRunner.query(`DROP TABLE "message_batches"`);
        await queryRunner.query(`DROP INDEX "IDX_399833392126349ef0b04b9bed"`);
        await queryRunner.query(`DROP INDEX "IDX_36bc604c820bb9adc4c75cd411"`);
        await queryRunner.query(`DROP INDEX "IDX_befd307485dbf0559d17e4a4d2"`);
        await queryRunner.query(`DROP INDEX "IDX_066163c46cda7e8187f96bc87a"`);
        await queryRunner.query(`DROP TABLE "messages"`);
        await queryRunner.query(`DROP TABLE "webhooks"`);
        await queryRunner.query(`DROP TABLE "sessions"`);
    }
}
exports.AddMessageStatus1770108659848 = AddMessageStatus1770108659848;
//# sourceMappingURL=1770108659848-AddMessageStatus.js.map