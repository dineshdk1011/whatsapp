"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddUuidDefaultsForPostgres1779235200000 = void 0;
const pgcrypto_search_path_1 = require("../pgcrypto-search-path");
class AddUuidDefaultsForPostgres1779235200000 {
    name = 'AddUuidDefaultsForPostgres1779235200000';
    tables = ['sessions', 'webhooks', 'messages', 'message_batches'];
    async up(queryRunner) {
        if (queryRunner.dataSource.options.type !== 'postgres')
            return;
        const versionRows = (await queryRunner.query(`SELECT current_setting('server_version_num')::int AS num`));
        const versionNum = Number(versionRows?.[0]?.num ?? 0);
        if (versionNum > 0 && versionNum < 130000) {
            const installed = (await queryRunner.query(`SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto'`));
            if (!installed?.length) {
                try {
                    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);
                }
                catch (err) {
                    throw new Error(`PostgreSQL ${versionNum} (< 13) needs the pgcrypto extension for gen_random_uuid(), but it is ` +
                        `not installed and this database role cannot create it. Have a superuser run ` +
                        `"CREATE EXTENSION pgcrypto;" once, then restart.`, { cause: err });
                }
            }
            await (0, pgcrypto_search_path_1.assertPgcryptoOnSearchPath)(queryRunner, versionNum);
        }
        for (const table of this.tables) {
            const exists = await queryRunner.hasTable(table);
            if (!exists)
                continue;
            await queryRunner.query(`ALTER TABLE "${table}" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::varchar`);
        }
    }
    async down(queryRunner) {
        if (queryRunner.dataSource.options.type !== 'postgres')
            return;
        for (const table of this.tables) {
            const exists = await queryRunner.hasTable(table);
            if (!exists)
                continue;
            await queryRunner.query(`ALTER TABLE "${table}" ALTER COLUMN "id" DROP DEFAULT`);
        }
    }
}
exports.AddUuidDefaultsForPostgres1779235200000 = AddUuidDefaultsForPostgres1779235200000;
//# sourceMappingURL=1779235200000-AddUuidDefaultsForPostgres.js.map