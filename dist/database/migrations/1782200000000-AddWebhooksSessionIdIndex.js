"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddWebhooksSessionIdIndex1782200000000 = void 0;
class AddWebhooksSessionIdIndex1782200000000 {
    name = 'AddWebhooksSessionIdIndex1782200000000';
    async up(queryRunner) {
        if (queryRunner.dataSource.options.type === 'postgres') {
            await queryRunner.query('SET LOCAL statement_timeout = 0');
        }
        if (!(await queryRunner.hasTable('webhooks')))
            return;
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_webhooks_sessionId" ON "webhooks" ("sessionId")`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_webhooks_sessionId"`);
    }
}
exports.AddWebhooksSessionIdIndex1782200000000 = AddWebhooksSessionIdIndex1782200000000;
//# sourceMappingURL=1782200000000-AddWebhooksSessionIdIndex.js.map