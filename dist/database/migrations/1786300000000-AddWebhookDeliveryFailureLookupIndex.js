"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddWebhookDeliveryFailureLookupIndex1786300000000 = void 0;
class AddWebhookDeliveryFailureLookupIndex1786300000000 {
    name = 'AddWebhookDeliveryFailureLookupIndex1786300000000';
    async up(queryRunner) {
        if (queryRunner.dataSource.options.type === 'postgres') {
            await queryRunner.query('SET LOCAL statement_timeout = 0');
        }
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_webhook_delivery_failures_delivery" ON "webhook_delivery_failures" ("webhookId", "idempotencyKey")`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_webhook_delivery_failures_delivery"`);
    }
}
exports.AddWebhookDeliveryFailureLookupIndex1786300000000 = AddWebhookDeliveryFailureLookupIndex1786300000000;
//# sourceMappingURL=1786300000000-AddWebhookDeliveryFailureLookupIndex.js.map