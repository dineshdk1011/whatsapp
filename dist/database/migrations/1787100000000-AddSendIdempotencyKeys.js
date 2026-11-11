"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddSendIdempotencyKeys1787100000000 = void 0;
class AddSendIdempotencyKeys1787100000000 {
    name = 'AddSendIdempotencyKeys1787100000000';
    async up(queryRunner) {
        if (await queryRunner.hasTable('send_idempotency_keys'))
            return;
        const isPostgres = queryRunner.connection.options.type === 'postgres';
        const id = isPostgres
            ? `"id" varchar PRIMARY KEY NOT NULL DEFAULT gen_random_uuid()::varchar`
            : `"id" varchar PRIMARY KEY NOT NULL`;
        const expiresTs = isPostgres ? 'timestamp' : 'text';
        const createdTs = isPostgres ? 'timestamp' : 'datetime';
        const now = isPostgres ? 'NOW()' : `(datetime('now'))`;
        await queryRunner.query(`CREATE TABLE "send_idempotency_keys" (${id}, "sessionId" varchar NOT NULL, ` +
            `"idempotencyKey" varchar NOT NULL, "route" varchar NOT NULL, "requestHash" varchar NOT NULL, ` +
            `"state" varchar NOT NULL, "responseBody" text, "expiresAt" ${expiresTs} NOT NULL, ` +
            `"createdAt" ${createdTs} NOT NULL DEFAULT ${now})`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_send_idempotency_keys_session_key" ON "send_idempotency_keys" ("sessionId", "idempotencyKey")`);
        await queryRunner.query(`CREATE INDEX "IDX_send_idempotency_keys_expiresAt" ON "send_idempotency_keys" ("expiresAt")`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_send_idempotency_keys_expiresAt"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "UQ_send_idempotency_keys_session_key"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "send_idempotency_keys"`);
    }
}
exports.AddSendIdempotencyKeys1787100000000 = AddSendIdempotencyKeys1787100000000;
//# sourceMappingURL=1787100000000-AddSendIdempotencyKeys.js.map