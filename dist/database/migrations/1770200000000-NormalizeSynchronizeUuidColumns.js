"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NormalizeSynchronizeUuidColumns1770200000000 = void 0;
const pgcrypto_search_path_1 = require("../pgcrypto-search-path");
class NormalizeSynchronizeUuidColumns1770200000000 {
    name = 'NormalizeSynchronizeUuidColumns1770200000000';
    uuidPkTables = [
        'sessions',
        'webhooks',
        'messages',
        'message_batches',
        'templates',
        'baileys_stored_messages',
        'webhook_delivery_failures',
        'conversation_mappings',
        'integration_delivery_failures',
    ];
    sessionFks = [
        { table: 'webhooks', column: 'sessionId', name: 'FK_d209715bb62b12255e825580af6' },
        { table: 'templates', column: 'sessionId', name: 'FK_templates_sessionId' },
        { table: 'baileys_stored_messages', column: 'sessionId', name: 'FK_baileys_stored_messages_sessionId' },
    ];
    async up(queryRunner) {
        if (queryRunner.dataSource.options.type !== 'postgres')
            return;
        if (!(await this.columnIsUuid(queryRunner, 'sessions', 'id')))
            return;
        await queryRunner.query(`SET LOCAL statement_timeout = 0`);
        await this.ensureGenRandomUuid(queryRunner);
        for (const fk of this.sessionFks) {
            if (!(await queryRunner.hasTable(fk.table)))
                continue;
            for (const c of await this.fkConstraintNames(queryRunner, fk.table, fk.column, 'sessions')) {
                await queryRunner.query(`ALTER TABLE "${fk.table}" DROP CONSTRAINT IF EXISTS "${c}"`);
            }
        }
        for (const t of this.uuidPkTables) {
            if (!(await queryRunner.hasTable(t)))
                continue;
            if (!(await this.columnIsUuid(queryRunner, t, 'id')))
                continue;
            await queryRunner.query(`ALTER TABLE "${t}" ALTER COLUMN "id" DROP DEFAULT`);
            await queryRunner.query(`ALTER TABLE "${t}" ALTER COLUMN "id" TYPE varchar USING "id"::text`);
        }
        for (const fk of this.sessionFks) {
            if (!(await queryRunner.hasTable(fk.table)))
                continue;
            if (!(await this.columnIsUuid(queryRunner, fk.table, fk.column)))
                continue;
            await queryRunner.query(`ALTER TABLE "${fk.table}" ALTER COLUMN "${fk.column}" TYPE varchar USING "${fk.column}"::text`);
        }
        for (const fk of this.sessionFks) {
            if (!(await queryRunner.hasTable(fk.table)))
                continue;
            await queryRunner.query(`ALTER TABLE "${fk.table}" ADD CONSTRAINT "${fk.name}" ` +
                `FOREIGN KEY ("${fk.column}") REFERENCES "sessions" ("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        }
        for (const t of this.uuidPkTables) {
            if (!(await queryRunner.hasTable(t)))
                continue;
            await queryRunner.query(`ALTER TABLE "${t}" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::varchar`);
        }
    }
    async down(queryRunner) {
        if (queryRunner.dataSource.options.type !== 'postgres')
            return;
        if (await this.columnIsUuid(queryRunner, 'sessions', 'id'))
            return;
        await queryRunner.query(`SET LOCAL statement_timeout = 0`);
        await this.ensureGenRandomUuid(queryRunner);
        for (const fk of this.sessionFks) {
            if (!(await queryRunner.hasTable(fk.table)))
                continue;
            for (const c of await this.fkConstraintNames(queryRunner, fk.table, fk.column, 'sessions')) {
                await queryRunner.query(`ALTER TABLE "${fk.table}" DROP CONSTRAINT IF EXISTS "${c}"`);
            }
        }
        for (const t of this.uuidPkTables) {
            if (!(await queryRunner.hasTable(t)))
                continue;
            await queryRunner.query(`ALTER TABLE "${t}" ALTER COLUMN "id" DROP DEFAULT`);
            await queryRunner.query(`ALTER TABLE "${t}" ALTER COLUMN "id" TYPE uuid USING "id"::uuid`);
        }
        for (const fk of this.sessionFks) {
            if (!(await queryRunner.hasTable(fk.table)))
                continue;
            await queryRunner.query(`ALTER TABLE "${fk.table}" ALTER COLUMN "${fk.column}" TYPE uuid USING "${fk.column}"::uuid`);
        }
        for (const fk of this.sessionFks) {
            if (!(await queryRunner.hasTable(fk.table)))
                continue;
            await queryRunner.query(`ALTER TABLE "${fk.table}" ADD CONSTRAINT "${fk.name}" ` +
                `FOREIGN KEY ("${fk.column}") REFERENCES "sessions" ("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        }
        for (const t of this.uuidPkTables) {
            if (!(await queryRunner.hasTable(t)))
                continue;
            await queryRunner.query(`ALTER TABLE "${t}" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        }
    }
    async columnIsUuid(queryRunner, table, column) {
        const rows = (await queryRunner.query(`SELECT udt_name FROM information_schema.columns ` +
            `WHERE table_schema = current_schema() AND table_name = $1 AND column_name = $2`, [table, column]));
        return rows?.[0]?.udt_name === 'uuid';
    }
    async fkConstraintNames(queryRunner, table, column, referenced) {
        const rows = (await queryRunner.query(`SELECT c.conname FROM pg_constraint c ` +
            `JOIN pg_class cl ON c.conrelid = cl.oid JOIN pg_namespace n ON cl.relnamespace = n.oid ` +
            `JOIN pg_attribute a ON a.attrelid = cl.oid AND a.attnum = ANY(c.conkey) ` +
            `JOIN pg_class ref ON c.confrelid = ref.oid JOIN pg_namespace rn ON ref.relnamespace = rn.oid ` +
            `WHERE c.contype = 'f' AND n.nspname = current_schema() AND cl.relname = $1 ` +
            `AND a.attname = $2 AND rn.nspname = current_schema() AND ref.relname = $3`, [table, column, referenced]));
        return (rows ?? []).map(r => r.conname);
    }
    async ensureGenRandomUuid(queryRunner) {
        const v = (await queryRunner.query(`SELECT current_setting('server_version_num')::int AS num`));
        const num = Number(v?.[0]?.num ?? 0);
        if (num > 0 && num < 130000) {
            const installed = (await queryRunner.query(`SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto'`));
            if (!installed?.length) {
                try {
                    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);
                }
                catch (err) {
                    throw new Error(`PostgreSQL ${num} (< 13) needs the pgcrypto extension for gen_random_uuid(), but it is ` +
                        `not installed and this database role cannot create it. Have a superuser run ` +
                        `"CREATE EXTENSION pgcrypto;" once, then restart.`, { cause: err });
                }
            }
            await (0, pgcrypto_search_path_1.assertPgcryptoOnSearchPath)(queryRunner, num);
        }
    }
}
exports.NormalizeSynchronizeUuidColumns1770200000000 = NormalizeSynchronizeUuidColumns1770200000000;
//# sourceMappingURL=1770200000000-NormalizeSynchronizeUuidColumns.js.map