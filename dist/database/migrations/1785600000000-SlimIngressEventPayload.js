"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlimIngressEventPayload1785600000000 = void 0;
class SlimIngressEventPayload1785600000000 {
    name = 'SlimIngressEventPayload1785600000000';
    async hasColumn(queryRunner, name) {
        if (queryRunner.connection.options.type === 'postgres') {
            const rows = (await queryRunner.query(`SELECT 1 FROM information_schema.columns
         WHERE table_schema = current_schema() AND table_name = 'ingress_events' AND column_name = '${name}'`));
            return rows.length > 0;
        }
        const rows = (await queryRunner.query(`PRAGMA table_info("ingress_events")`));
        return rows.some(r => r.name === name);
    }
    async isPayloadNullable(queryRunner) {
        if (queryRunner.connection.options.type === 'postgres') {
            const rows = (await queryRunner.query(`SELECT is_nullable FROM information_schema.columns
         WHERE table_schema = current_schema() AND table_name = 'ingress_events' AND column_name = 'payload'`));
            return rows[0]?.is_nullable === 'YES';
        }
        const rows = (await queryRunner.query(`PRAGMA table_info("ingress_events")`));
        const payload = rows.find(r => r.name === 'payload');
        return payload ? payload.notnull === 0 : true;
    }
    async retireNonPendingPayloads(queryRunner) {
        await queryRunner.query(`UPDATE "ingress_events" SET "payload" = NULL WHERE "dispatchState" IS NULL OR "dispatchState" <> 'pending'`);
    }
    async up(queryRunner) {
        const isPostgres = queryRunner.connection.options.type === 'postgres';
        if (await this.hasColumn(queryRunner, 'payloadHash'))
            return;
        if (isPostgres) {
            await queryRunner.query(`ALTER TABLE "ingress_events" ADD COLUMN "payloadHash" varchar NULL`);
            if (!(await this.isPayloadNullable(queryRunner))) {
                await queryRunner.query(`ALTER TABLE "ingress_events" ALTER COLUMN "payload" DROP NOT NULL`);
            }
            await this.retireNonPendingPayloads(queryRunner);
            return;
        }
        await queryRunner.query(`CREATE TABLE "ingress_events_new" (` +
            `"id" varchar PRIMARY KEY NOT NULL, "instanceId" varchar NOT NULL, "pluginId" varchar NOT NULL, ` +
            `"providerDeliveryId" varchar NOT NULL, "route" varchar NOT NULL, "payload" text NULL, ` +
            `"payloadHash" varchar NULL, "sessionId" varchar NULL, ` +
            `"dispatchState" varchar NULL, "dispatchAttempts" integer NOT NULL DEFAULT 0, "lastDispatchAt" datetime NULL, ` +
            `"createdAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`INSERT INTO "ingress_events_new" ("id","instanceId","pluginId","providerDeliveryId","route","payload","payloadHash","sessionId","dispatchState","dispatchAttempts","lastDispatchAt","createdAt") ` +
            `SELECT "id","instanceId","pluginId","providerDeliveryId","route",` +
            ` CASE WHEN "dispatchState" = 'pending' THEN "payload" ELSE NULL END,` +
            ` NULL,"sessionId","dispatchState","dispatchAttempts","lastDispatchAt","createdAt" FROM "ingress_events"`);
        await queryRunner.query(`DROP TABLE "ingress_events"`);
        await queryRunner.query(`ALTER TABLE "ingress_events_new" RENAME TO "ingress_events"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_ingress_events_instance_delivery" ON "ingress_events" ("pluginId", "instanceId", "providerDeliveryId")`);
        await queryRunner.query(`CREATE INDEX "IDX_ingress_events_createdAt" ON "ingress_events" ("createdAt")`);
        await queryRunner.query(`CREATE INDEX "IDX_ingress_events_dispatchState" ON "ingress_events" ("dispatchState", "createdAt")`);
    }
    async down(queryRunner) {
        const isPostgres = queryRunner.connection.options.type === 'postgres';
        if (!(await this.hasColumn(queryRunner, 'payloadHash')))
            return;
        const tombstone = '{"headers":{},"query":{},"body":"","rawBody":""}';
        if (isPostgres) {
            await queryRunner.query(`UPDATE "ingress_events" SET "payload" = '${tombstone}' WHERE "payload" IS NULL`);
            await queryRunner.query(`ALTER TABLE "ingress_events" ALTER COLUMN "payload" SET NOT NULL`);
            await queryRunner.query(`ALTER TABLE "ingress_events" DROP COLUMN "payloadHash"`);
            return;
        }
        await queryRunner.query(`CREATE TABLE "ingress_events_old" (` +
            `"id" varchar PRIMARY KEY NOT NULL, "instanceId" varchar NOT NULL, "pluginId" varchar NOT NULL, ` +
            `"providerDeliveryId" varchar NOT NULL, "route" varchar NOT NULL, "payload" text NOT NULL, ` +
            `"sessionId" varchar NULL, ` +
            `"dispatchState" varchar NULL, "dispatchAttempts" integer NOT NULL DEFAULT 0, "lastDispatchAt" datetime NULL, ` +
            `"createdAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`INSERT INTO "ingress_events_old" ("id","instanceId","pluginId","providerDeliveryId","route","payload","sessionId","dispatchState","dispatchAttempts","lastDispatchAt","createdAt") ` +
            `SELECT "id","instanceId","pluginId","providerDeliveryId","route",` +
            ` COALESCE("payload", '${tombstone}'),` +
            ` "sessionId","dispatchState","dispatchAttempts","lastDispatchAt","createdAt" FROM "ingress_events"`);
        await queryRunner.query(`DROP TABLE "ingress_events"`);
        await queryRunner.query(`ALTER TABLE "ingress_events_old" RENAME TO "ingress_events"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_ingress_events_instance_delivery" ON "ingress_events" ("pluginId", "instanceId", "providerDeliveryId")`);
        await queryRunner.query(`CREATE INDEX "IDX_ingress_events_createdAt" ON "ingress_events" ("createdAt")`);
        await queryRunner.query(`CREATE INDEX "IDX_ingress_events_dispatchState" ON "ingress_events" ("dispatchState", "createdAt")`);
    }
}
exports.SlimIngressEventPayload1785600000000 = SlimIngressEventPayload1785600000000;
//# sourceMappingURL=1785600000000-SlimIngressEventPayload.js.map