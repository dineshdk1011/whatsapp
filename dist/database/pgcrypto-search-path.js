"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertPgcryptoOnSearchPath = assertPgcryptoOnSearchPath;
async function assertPgcryptoOnSearchPath(queryRunner, versionNum) {
    const probe = (await queryRunner.query(`SELECT to_regprocedure('gen_random_uuid()') IS NULL AS missing`));
    if (!probe?.[0]?.missing)
        return;
    const rows = (await queryRunner.query(`SELECT n.nspname AS schema, current_setting('search_path') AS path ` +
        `FROM pg_extension e JOIN pg_namespace n ON n.oid = e.extnamespace WHERE e.extname = 'pgcrypto'`));
    const schema = rows?.[0]?.schema;
    throw new Error(`PostgreSQL ${versionNum} (< 13) takes gen_random_uuid() from the pgcrypto extension, which is installed in ` +
        `schema "${schema}", outside this connection's search_path (${rows?.[0]?.path}). It must live in ` +
        `POSTGRES_SCHEMA or public: have a superuser run "ALTER EXTENSION pgcrypto SET SCHEMA public;" once, then ` +
        `restart. Anything else that calls pgcrypto as "${schema}".<function> then has to use public.`);
}
//# sourceMappingURL=pgcrypto-search-path.js.map