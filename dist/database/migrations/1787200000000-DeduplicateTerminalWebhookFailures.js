"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeduplicateTerminalWebhookFailures1787200000000 = void 0;
class DeduplicateTerminalWebhookFailures1787200000000 {
    name = 'DeduplicateTerminalWebhookFailures1787200000000';
    async up(queryRunner) {
        if (queryRunner.dataSource.options.type === 'postgres')
            await queryRunner.query('SET LOCAL statement_timeout = 0');
        const payloadOrder = (await queryRunner.hasColumn('webhook_delivery_failures', 'payload'))
            ? 'CASE WHEN "payload" IS NOT NULL THEN 0 ELSE 1 END,'
            : '';
        await queryRunner.query(`DELETE FROM "webhook_delivery_failures" WHERE "id" IN (
      SELECT "id" FROM (
        SELECT "id", ROW_NUMBER() OVER (
          PARTITION BY "webhookId", "idempotencyKey"
          ORDER BY ${payloadOrder}
            "attempts" DESC, "createdAt" DESC, "id" DESC
        ) AS ordinal FROM "webhook_delivery_failures"
        WHERE "attempts" > 0 AND "idempotencyKey" IS NOT NULL
      ) AS ranked WHERE ordinal > 1
    )`);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_webhook_delivery_failures_terminal"
      ON "webhook_delivery_failures" ("webhookId", "idempotencyKey") WHERE "attempts" > 0`);
    }
    async down(queryRunner) {
        await queryRunner.query('DROP INDEX IF EXISTS "UQ_webhook_delivery_failures_terminal"');
    }
}
exports.DeduplicateTerminalWebhookFailures1787200000000 = DeduplicateTerminalWebhookFailures1787200000000;
//# sourceMappingURL=1787200000000-DeduplicateTerminalWebhookFailures.js.map