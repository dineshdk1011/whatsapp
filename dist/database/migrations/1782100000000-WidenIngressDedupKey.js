"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WidenIngressDedupKey1782100000000 = void 0;
class WidenIngressDedupKey1782100000000 {
    async up(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS "UQ_ingress_events_instance_delivery"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_ingress_events_instance_delivery" ON "ingress_events" ("pluginId", "instanceId", "providerDeliveryId")`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS "UQ_ingress_events_instance_delivery"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_ingress_events_instance_delivery" ON "ingress_events" ("instanceId", "providerDeliveryId")`);
    }
}
exports.WidenIngressDedupKey1782100000000 = WidenIngressDedupKey1782100000000;
//# sourceMappingURL=1782100000000-WidenIngressDedupKey.js.map