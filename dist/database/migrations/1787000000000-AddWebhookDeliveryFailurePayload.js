"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddWebhookDeliveryFailurePayload1787000000000 = void 0;
class AddWebhookDeliveryFailurePayload1787000000000 {
    name = 'AddWebhookDeliveryFailurePayload1787000000000';
    async up(queryRunner) {
        if (await queryRunner.hasColumn('webhook_delivery_failures', 'payload'))
            return;
        await queryRunner.query(`ALTER TABLE "webhook_delivery_failures" ADD COLUMN "payload" text`);
    }
    async down(queryRunner) {
        if (!(await queryRunner.hasColumn('webhook_delivery_failures', 'payload')))
            return;
        await queryRunner.query(`ALTER TABLE "webhook_delivery_failures" DROP COLUMN "payload"`);
    }
}
exports.AddWebhookDeliveryFailurePayload1787000000000 = AddWebhookDeliveryFailurePayload1787000000000;
//# sourceMappingURL=1787000000000-AddWebhookDeliveryFailurePayload.js.map