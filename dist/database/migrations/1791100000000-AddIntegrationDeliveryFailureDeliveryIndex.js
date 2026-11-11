"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddIntegrationDeliveryFailureDeliveryIndex1791100000000 = void 0;
class AddIntegrationDeliveryFailureDeliveryIndex1791100000000 {
    name = 'AddIntegrationDeliveryFailureDeliveryIndex1791100000000';
    async up(queryRunner) {
        if (queryRunner.dataSource.options.type === 'postgres') {
            await queryRunner.query('SET LOCAL statement_timeout = 0');
        }
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_integration_delivery_failures_instance_delivery" ON "integration_delivery_failures" ("pluginId", "instanceId", "deliveryId")`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_integration_delivery_failures_instance_delivery"`);
    }
}
exports.AddIntegrationDeliveryFailureDeliveryIndex1791100000000 = AddIntegrationDeliveryFailureDeliveryIndex1791100000000;
//# sourceMappingURL=1791100000000-AddIntegrationDeliveryFailureDeliveryIndex.js.map