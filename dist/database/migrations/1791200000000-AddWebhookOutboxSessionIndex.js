"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddWebhookOutboxSessionIndex1791200000000 = void 0;
class AddWebhookOutboxSessionIndex1791200000000 {
    name = 'AddWebhookOutboxSessionIndex1791200000000';
    async up(queryRunner) {
        if (queryRunner.dataSource.options.type === 'postgres') {
            await queryRunner.query('SET LOCAL statement_timeout = 0');
        }
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_webhook_outbox_events_sessionId" ON "webhook_outbox_events" ("sessionId")`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_webhook_outbox_events_sessionId"`);
    }
}
exports.AddWebhookOutboxSessionIndex1791200000000 = AddWebhookOutboxSessionIndex1791200000000;
//# sourceMappingURL=1791200000000-AddWebhookOutboxSessionIndex.js.map