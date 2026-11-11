"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddWebhookOutboxEvents1786200000000 = void 0;
class AddWebhookOutboxEvents1786200000000 {
    name = 'AddWebhookOutboxEvents1786200000000';
    async up(queryRunner) {
        if (await queryRunner.hasTable('webhook_outbox_events'))
            return;
        const isPostgres = queryRunner.connection.options.type === 'postgres';
        const id = isPostgres
            ? `"id" varchar PRIMARY KEY NOT NULL DEFAULT gen_random_uuid()::varchar`
            : `"id" varchar PRIMARY KEY NOT NULL`;
        const nullableTs = isPostgres ? 'timestamp' : 'text';
        const createdTs = isPostgres ? 'timestamp' : 'datetime';
        const now = isPostgres ? 'NOW()' : `(datetime('now'))`;
        await queryRunner.query(`CREATE TABLE "webhook_outbox_events" (${id}, "webhookId" varchar NOT NULL, "sessionId" varchar NOT NULL, ` +
            `"event" varchar NOT NULL, "idempotencyKey" varchar NOT NULL, "deliveryId" varchar NOT NULL, ` +
            `"payload" text, "state" varchar, "attempts" integer NOT NULL DEFAULT (0), "lastAttemptAt" ${nullableTs}, ` +
            `"createdAt" ${createdTs} NOT NULL DEFAULT ${now})`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_webhook_outbox_events_webhook_key" ON "webhook_outbox_events" ("webhookId", "idempotencyKey")`);
        await queryRunner.query(`CREATE INDEX "IDX_webhook_outbox_events_state_createdAt" ON "webhook_outbox_events" ("state", "createdAt")`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_webhook_outbox_events_state_createdAt"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "UQ_webhook_outbox_events_webhook_key"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "webhook_outbox_events"`);
    }
}
exports.AddWebhookOutboxEvents1786200000000 = AddWebhookOutboxEvents1786200000000;
//# sourceMappingURL=1786200000000-AddWebhookOutboxEvents.js.map