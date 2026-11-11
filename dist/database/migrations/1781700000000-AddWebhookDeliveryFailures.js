"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddWebhookDeliveryFailures1781700000000 = void 0;
class AddWebhookDeliveryFailures1781700000000 {
    name = 'AddWebhookDeliveryFailures1781700000000';
    async up(queryRunner) {
        if (await queryRunner.hasTable('webhook_delivery_failures'))
            return;
        const isPostgres = queryRunner.dataSource.options.type === 'postgres';
        if (isPostgres) {
            await queryRunner.query(`CREATE TABLE "webhook_delivery_failures" ("id" varchar PRIMARY KEY NOT NULL DEFAULT gen_random_uuid()::varchar, "webhookId" varchar NOT NULL, "sessionId" varchar NOT NULL, "event" varchar NOT NULL, "url" varchar NOT NULL, "idempotencyKey" varchar, "deliveryId" varchar, "attempts" integer NOT NULL, "lastStatusCode" integer, "lastError" text NOT NULL, "createdAt" timestamp NOT NULL DEFAULT NOW())`);
        }
        else {
            await queryRunner.query(`CREATE TABLE "webhook_delivery_failures" ("id" varchar PRIMARY KEY NOT NULL, "webhookId" varchar NOT NULL, "sessionId" varchar NOT NULL, "event" varchar NOT NULL, "url" varchar NOT NULL, "idempotencyKey" varchar, "deliveryId" varchar, "attempts" integer NOT NULL, "lastStatusCode" integer, "lastError" text NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        }
        await queryRunner.query(`CREATE INDEX "IDX_webhook_delivery_failures_sessionId" ON "webhook_delivery_failures" ("sessionId")`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_webhook_delivery_failures_sessionId"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "webhook_delivery_failures"`);
    }
}
exports.AddWebhookDeliveryFailures1781700000000 = AddWebhookDeliveryFailures1781700000000;
//# sourceMappingURL=1781700000000-AddWebhookDeliveryFailures.js.map