"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateStatusUpdates1784822470680 = void 0;
class CreateStatusUpdates1784822470680 {
    name = 'CreateStatusUpdates1784822470680';
    async up(queryRunner) {
        if (await queryRunner.hasTable('status_updates'))
            return;
        const isPostgres = queryRunner.dataSource.options.type === 'postgres';
        const boolFalse = isPostgres ? 'false' : '0';
        const idColumn = isPostgres
            ? `"id" varchar PRIMARY KEY NOT NULL DEFAULT gen_random_uuid()::varchar`
            : `"id" varchar PRIMARY KEY NOT NULL`;
        await queryRunner.query(`CREATE TABLE "status_updates" (` +
            `${idColumn}, "sessionId" varchar NOT NULL, "contactJid" varchar NOT NULL, ` +
            `"contactName" varchar, "contactPushName" varchar, "waStatusId" varchar NOT NULL, "type" varchar NOT NULL, ` +
            `"caption" text, "mediaPath" varchar, "mediaMimetype" varchar, ` +
            `"mediaOmitted" boolean NOT NULL DEFAULT ${boolFalse}, "omitReason" varchar, "backgroundColor" varchar, ` +
            `"font" integer, "postedAt" bigint NOT NULL, "expiresAt" bigint NOT NULL)`);
        await queryRunner.query(`CREATE INDEX "IDX_status_updates_sessionId_contactJid" ON "status_updates" ("sessionId", "contactJid")`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_status_updates_sessionId_waStatusId" ON "status_updates" ("sessionId", "waStatusId")`);
        await queryRunner.query(`CREATE INDEX "IDX_status_updates_expiresAt" ON "status_updates" ("expiresAt")`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_status_updates_expiresAt"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "UQ_status_updates_sessionId_waStatusId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_status_updates_sessionId_contactJid"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "status_updates"`);
    }
}
exports.CreateStatusUpdates1784822470680 = CreateStatusUpdates1784822470680;
//# sourceMappingURL=1784822470680-CreateStatusUpdates.js.map