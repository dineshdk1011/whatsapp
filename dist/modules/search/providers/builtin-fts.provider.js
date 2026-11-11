"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var BuiltInFtsProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuiltInFtsProvider = exports.TRIGRAM_BUILD_LOCK = exports.TRIGRAM_BUILD_LOCK_KEY = void 0;
exports.sqliteSupportsTrigramDiacritics = sqliteSupportsTrigramDiacritics;
exports.postgresUnaccentFunctionDdl = postgresUnaccentFunctionDdl;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const promises_1 = require("node:timers/promises");
const logger_service_1 = require("../../../common/services/logger.service");
const shared_connection_1 = require("../../../common/utils/shared-connection");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const search_constants_1 = require("../search.constants");
const search_terms_1 = require("../search-terms");
const search_snippet_1 = require("../search-snippet");
const search_score_1 = require("../search-score");
const MAX_SNIPPET_WORDS = 24;
const WORD_INDEX = { table: 'messages_fts' };
const TRIGRAM_INDEX = { table: 'messages_trgm', tokenize: 'trigram remove_diacritics 1', batched: true };
const TRIGRAM_BACKFILL_BATCH = 1000;
exports.TRIGRAM_BUILD_LOCK_KEY = 0x7472676d;
exports.TRIGRAM_BUILD_LOCK = `$1, to_regclass('messages')::oid::int`;
const TRIGRAM_BUILD_RETRY_MS = 30_000;
const CONTAINS_UNAVAILABLE = {
    disabled: 'Contains search is disabled: set SEARCH_CONTAINS_ENABLED=true and restart to build its index.',
    building: 'Contains search is not ready: its index is still being built (SEARCH_CONTAINS_ENABLED=true). Retry shortly.',
    failed: 'Contains search is unavailable: building its index failed (SEARCH_CONTAINS_ENABLED=true); see the server log.',
    postgresExtensions: 'Contains search is unavailable: install the pg_trgm and unaccent extensions (CREATE EXTENSION pg_trgm; CREATE EXTENSION unaccent;) and restart.',
    sqliteTrigram: 'Contains search is unavailable: this SQLite build has no FTS5 trigram tokenizer (SQLite 3.45+ is required).',
};
const POSTGRES_TRIGRAM_SOURCE = new RegExp(`(?:(?![\\u02b9-\\u02bd\\u02c6\\u02c8\\u02cb\\u02d0])[\\p{L}\\p{Nl}\\p{Nd}]){${search_constants_1.SEARCH_CONTAINS_MIN_TERM_LENGTH}}`, 'u');
const POSTGRES_ASCII_TRIGRAM_SOURCE = new RegExp(`[A-Za-z0-9]{${search_constants_1.SEARCH_CONTAINS_MIN_TERM_LENGTH}}`);
const CONTAINS_COLUMNS = `m."id", m."waMessageId" AS wa_message_id, m."sessionId" AS session_id, m."chatId" AS chat_id, m."from" AS "from", m."body", m."timestamp", m."type", m."direction"`;
function compareDescending(a, b) {
    if (a === b)
        return 0;
    return a < b ? 1 : -1;
}
function sqliteSupportsTrigramDiacritics(version) {
    const [major, minor] = version.split('.').map(Number);
    return major > 3 || (major === 3 && minor >= 45);
}
function quoteIdent(name) {
    return `"${name.replace(/"/g, '""')}"`;
}
function postgresUnaccentFunctionDdl(unaccentSchema) {
    const schema = quoteIdent(unaccentSchema);
    return `CREATE OR REPLACE FUNCTION openwa_unaccent(text) RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT AS $$ SELECT ${schema}.unaccent('${schema.replace(/'/g, "''")}.unaccent'::regdictionary, $1) $$`;
}
function likePattern(term) {
    return `%${term.replace(/[\\%_]/g, '\\$&')}%`;
}
function postgresLikePattern(placeholder) {
    return String.raw `'%' || replace(replace(replace(openwa_unaccent(${placeholder}), E'\\', E'\\\\'), '%', E'\\%'), '_', E'\\_') || '%'`;
}
function isShortTerm(term) {
    return [...(0, search_terms_1.foldSearchText)(term)].length < search_constants_1.SEARCH_CONTAINS_MIN_TERM_LENGTH;
}
function postgresCanIndex(term, asciiOnly) {
    return (asciiOnly ? POSTGRES_ASCII_TRIGRAM_SOURCE : POSTGRES_TRIGRAM_SOURCE).test((0, search_terms_1.foldSearchText)(term));
}
class ConnectionBusyError extends Error {
}
let BuiltInFtsProvider = class BuiltInFtsProvider {
    static { BuiltInFtsProvider_1 = this; }
    dataSource;
    adapterHost;
    id = 'builtin-fts';
    label = 'Built-in database full-text search';
    logger = (0, logger_service_1.createLogger)('BuiltInFtsProvider');
    containsEnabled;
    containsUnavailable;
    containsBuildRetry;
    containsBuildRetryMs = TRIGRAM_BUILD_RETRY_MS;
    destroyed = false;
    postgresAsciiTrigrams = false;
    constructor(dataSource, config, adapterHost) {
        this.dataSource = dataSource;
        this.adapterHost = adapterHost;
        this.containsEnabled = config?.get('search.containsEnabled') === true;
        this.containsUnavailable = this.containsEnabled ? CONTAINS_UNAVAILABLE.building : CONTAINS_UNAVAILABLE.disabled;
    }
    async onModuleInit() {
        try {
            this.ftsAvailable = await this.ensureFtsSchema();
            if (this.ftsAvailable) {
                this.logger.log('FTS index ready');
            }
            else {
                this.logger.warn('FTS index unavailable (SQLite built without FTS5); /api/search will return 501');
            }
        }
        catch (e) {
            this.logger.error(`Failed to ensure FTS schema: ${e instanceof Error ? e.message : String(e)}`);
        }
    }
    onApplicationBootstrap() {
        if (!this.containsEnabled || !this.adapterHost)
            return;
        if (this.adapterHost.listening)
            void this.buildContainsIndex();
        else
            this.adapterHost.listen$.subscribe(() => void this.buildContainsIndex());
    }
    ftsAvailable = null;
    async probeFts() {
        if (this.ftsAvailable !== null)
            return this.ftsAvailable;
        if (this.dataSource.options.type === 'postgres') {
            let rows;
            try {
                rows = await this.dataSource.query(`SELECT a.attname FROM pg_attribute a WHERE a.attrelid = to_regclass('messages') AND a.attname = 'body_ts' AND NOT a.attisdropped`);
            }
            catch (e) {
                this.logger.warn(`FTS probe failed; treating the index as unavailable: ${e instanceof Error ? e.message : String(e)}`);
                return false;
            }
            this.ftsAvailable = Array.isArray(rows) && rows.length >= 1;
        }
        else {
            const rows = await this.dataSource.query(`SELECT name FROM sqlite_master WHERE type='table' AND name='messages_fts'`);
            this.ftsAvailable = Array.isArray(rows) && rows.length === 1;
        }
        return this.ftsAvailable;
    }
    async ensureFts() {
        const ok = await this.probeFts();
        if (!ok) {
            throw new common_1.NotImplementedException('Search is unavailable: the database has no full-text index.');
        }
    }
    async ensureFtsSchema() {
        const isPostgres = this.dataSource.options.type === 'postgres';
        if (isPostgres) {
            const rows = await this.dataSource.query(`SELECT EXISTS (SELECT 1 FROM pg_attribute a WHERE a.attrelid = to_regclass('messages') AND a.attname = 'body_ts' AND NOT a.attisdropped) AS col,
                EXISTS (SELECT 1 FROM pg_index i JOIN pg_class c ON c.oid = i.indexrelid WHERE i.indrelid = to_regclass('messages') AND c.relname = 'idx_messages_body_ts') AS idx`);
            if (!rows[0]?.col) {
                await this.dataSource.query(`ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "body_ts" tsvector GENERATED ALWAYS AS (to_tsvector('simple', coalesce(body, ''))) STORED`);
            }
            if (!rows[0]?.idx) {
                await this.dataSource.query(`CREATE INDEX IF NOT EXISTS "idx_messages_body_ts" ON "messages" USING GIN ("body_ts")`);
            }
            return true;
        }
        if (!(await this.sqliteHasFts5()))
            return false;
        await this.ensureSqliteIndex(WORD_INDEX);
        return true;
    }
    async sqliteHasFts5() {
        const fts5 = await this.dataSource.query(`SELECT sqlite_compileoption_used('ENABLE_FTS5') AS enabled`);
        return Boolean(Number(fts5[0]?.enabled));
    }
    async ensureSqliteIndex({ table, tokenize, batched }) {
        const docsize = `${table}_docsize`;
        await this.dataSource.query(`CREATE VIRTUAL TABLE IF NOT EXISTS "${table}" USING fts5(body, content='messages', content_rowid='rowid'${tokenize ? `, tokenize='${tokenize}'` : ''})`);
        const orphanRow = await this.dataSource.query(`SELECT EXISTS(SELECT 1 FROM "${docsize}" d
         WHERE NOT EXISTS (SELECT 1 FROM "messages" m WHERE m."rowid" = d."rowid")) AS orphan`);
        if (Number(orphanRow[0]?.orphan)) {
            this.logger.warn(`${table} holds rows the messages table no longer has; re-indexing every message`);
            await this.dataSource.query(`INSERT INTO "${table}"("${table}") VALUES ('delete-all')`);
        }
        if (batched) {
            const [counts] = await this.dataSource.query(`SELECT (SELECT count(*) FROM "messages") AS messages, (SELECT count(*) FROM "${docsize}") AS indexed,
           (SELECT count(*) FROM sqlite_master WHERE type = 'trigger' AND tbl_name = 'messages'
             AND name IN ('${table}_ai', '${table}_ad', '${table}_au')) AS triggers`);
            if (Number(counts.messages) !== Number(counts.indexed) || Number(counts.triggers) !== 3) {
                await this.dataSource.query(`INSERT INTO "${table}"("${table}") VALUES ('delete-all')`);
            }
        }
        else {
            const gapRow = await this.dataSource.query(`SELECT EXISTS(SELECT 1 FROM "messages" m WHERE m."body" IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM "${docsize}" d WHERE d."rowid" = m."rowid")) AS missing`);
            if (Number(gapRow[0]?.missing)) {
                await this.dataSource.query(`INSERT INTO "${table}"("rowid", "body")
           SELECT m."rowid", m."body" FROM "messages" m WHERE m."body" IS NOT NULL
           AND NOT EXISTS (SELECT 1 FROM "${docsize}" d WHERE d."rowid" = m."rowid")`);
            }
        }
        const deleteOld = batched
            ? `INSERT INTO "${table}"("${table}", "rowid", "body") SELECT 'delete', old."rowid", old."body" WHERE EXISTS (SELECT 1 FROM "${docsize}" WHERE "rowid" = old."rowid");`
            : `INSERT INTO "${table}"("${table}", "rowid", "body") VALUES ('delete', old."rowid", old."body");`;
        await this.dataSource.query(`DROP TRIGGER IF EXISTS ${table}_ai`);
        await this.dataSource.query(`CREATE TRIGGER ${table}_ai AFTER INSERT ON "messages" BEGIN
      INSERT INTO "${table}"("rowid", "body") VALUES (new."rowid", new."body");
    END`);
        await this.dataSource.query(`DROP TRIGGER IF EXISTS ${table}_ad`);
        await this.dataSource.query(`CREATE TRIGGER ${table}_ad AFTER DELETE ON "messages" BEGIN
      ${deleteOld}
    END`);
        await this.dataSource.query(`DROP TRIGGER IF EXISTS ${table}_au`);
        await this.dataSource.query(`CREATE TRIGGER ${table}_au AFTER UPDATE ON "messages" WHEN OLD.body IS NOT NEW.body BEGIN
      ${deleteOld}
      INSERT INTO "${table}"("rowid", "body") VALUES (new."rowid", new."body");
    END`);
        if (batched)
            await this.backfillSqliteIndexInBatches(table);
    }
    async backfillSqliteIndexInBatches(table) {
        const [{ last }] = await this.dataSource.query(`SELECT max("rowid") AS last FROM "messages"`);
        for (let from = 0; from < (last ?? 0); from += TRIGRAM_BACKFILL_BATCH) {
            if (!(await (0, shared_connection_1.awaitNoOpenTransaction)(this.dataSource))) {
                throw new ConnectionBusyError('Another database transaction stayed open');
            }
            await this.dataSource.query(`INSERT INTO "${table}"("rowid", "body")
           SELECT m."rowid", m."body" FROM "messages" m
           WHERE m."rowid" > ? AND m."rowid" <= ?
           AND NOT EXISTS (SELECT 1 FROM "${table}_docsize" d WHERE d."rowid" = m."rowid")`, [from, from + TRIGRAM_BACKFILL_BATCH]);
            await (0, promises_1.setImmediate)();
        }
    }
    async buildContainsIndex() {
        if (!this.containsEnabled)
            return;
        const start = Date.now();
        try {
            this.containsUnavailable =
                this.dataSource.options.type === 'postgres'
                    ? await this.buildPostgresTrigramIndex()
                    : await this.buildSqliteTrigramIndex();
        }
        catch (e) {
            if (!(e instanceof ConnectionBusyError)) {
                this.containsUnavailable = CONTAINS_UNAVAILABLE.failed;
                this.logger.error(`Failed to build the trigram index: ${e instanceof Error ? e.message : String(e)}`);
                return;
            }
            this.containsUnavailable = CONTAINS_UNAVAILABLE.building;
            this.logger.warn(`Trigram index build postponed: ${e.message}`);
        }
        if (this.containsUnavailable === CONTAINS_UNAVAILABLE.building)
            this.retryContainsBuild();
        else if (this.containsUnavailable)
            this.logger.warn(this.containsUnavailable);
        else
            this.logger.log(`Trigram index ready in ${Date.now() - start} ms`);
    }
    retryContainsBuild() {
        if (this.destroyed)
            return;
        this.containsBuildRetry = setTimeout(() => {
            if (this.containsUnavailable === CONTAINS_UNAVAILABLE.building)
                void this.buildContainsIndex();
        }, this.containsBuildRetryMs);
        this.containsBuildRetry.unref();
    }
    onModuleDestroy() {
        this.destroyed = true;
        clearTimeout(this.containsBuildRetry);
    }
    async buildSqliteTrigramIndex() {
        if (!(await this.sqliteHasFts5()))
            return CONTAINS_UNAVAILABLE.sqliteTrigram;
        const rows = await this.dataSource.query(`SELECT sqlite_version() AS version`);
        if (!sqliteSupportsTrigramDiacritics(rows[0]?.version ?? ''))
            return CONTAINS_UNAVAILABLE.sqliteTrigram;
        if (!(await (0, shared_connection_1.awaitNoOpenTransaction)(this.dataSource))) {
            throw new ConnectionBusyError('Another database transaction stayed open');
        }
        await this.ensureSqliteIndex(TRIGRAM_INDEX);
        return null;
    }
    async buildPostgresTrigramIndex() {
        const runner = this.dataSource.createQueryRunner();
        await runner.connect();
        try {
            const [{ ctype }] = await runner.manager.query(`SELECT datctype AS ctype FROM pg_database WHERE datname = current_database()`);
            this.postgresAsciiTrigrams = ctype === 'C' || ctype === 'POSIX';
            const [{ locked }] = await runner.manager.query(`SELECT pg_try_advisory_lock(${exports.TRIGRAM_BUILD_LOCK}) AS locked`, [exports.TRIGRAM_BUILD_LOCK_KEY]);
            if (!locked)
                return CONTAINS_UNAVAILABLE.building;
            let bound;
            try {
                const [shown] = await runner.manager.query('SHOW statement_timeout');
                bound = shown?.statement_timeout;
                await runner.query('SET statement_timeout = 0');
                return await this.createPostgresTrigramSchema(runner);
            }
            finally {
                if (bound !== undefined)
                    await runner.query(`SELECT set_config('statement_timeout', $1, false)`, [bound]);
                await runner.query(`SELECT pg_advisory_unlock(${exports.TRIGRAM_BUILD_LOCK})`, [exports.TRIGRAM_BUILD_LOCK_KEY]);
            }
        }
        finally {
            await runner.release();
        }
    }
    async createPostgresTrigramSchema(runner) {
        try {
            await runner.query('CREATE EXTENSION IF NOT EXISTS pg_trgm');
            await runner.query('CREATE EXTENSION IF NOT EXISTS unaccent');
        }
        catch (e) {
            this.logger.warn(`Cannot create the pg_trgm and unaccent extensions: ${e instanceof Error ? e.message : String(e)}`);
            return CONTAINS_UNAVAILABLE.postgresExtensions;
        }
        const [{ trgm, unaccent, fn, idx }] = await this.postgresTrigramState(runner);
        if (!trgm || !unaccent)
            return CONTAINS_UNAVAILABLE.postgresExtensions;
        if (!fn)
            await runner.query(postgresUnaccentFunctionDdl(unaccent));
        if (idx === false)
            await runner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_messages_body_trgm"`);
        if (idx !== true) {
            await runner.query(`CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_messages_body_trgm" ON "messages" USING GIN (openwa_unaccent("body") ${quoteIdent(trgm)}.gin_trgm_ops)`);
        }
        return null;
    }
    postgresTrigramState(runner) {
        return (runner ?? this.dataSource).manager.query(`SELECT (SELECT n.nspname FROM pg_extension e JOIN pg_namespace n ON n.oid = e.extnamespace WHERE e.extname = 'pg_trgm') AS trgm,
              (SELECT n.nspname FROM pg_extension e JOIN pg_namespace n ON n.oid = e.extnamespace WHERE e.extname = 'unaccent') AS unaccent,
              to_regprocedure('openwa_unaccent(text)') IS NOT NULL AS fn,
              (SELECT i.indisvalid FROM pg_index i JOIN pg_class c ON c.oid = i.indexrelid WHERE i.indrelid = to_regclass('messages') AND c.relname = 'idx_messages_body_trgm') AS idx`);
    }
    async probePostgresTrigram() {
        try {
            const [{ trgm, unaccent, fn, idx }] = await this.postgresTrigramState();
            if (trgm && unaccent && fn && idx)
                this.containsUnavailable = null;
        }
        catch (e) {
            this.logger.warn(`Trigram probe failed; treating contains search as unavailable: ${e instanceof Error ? e.message : String(e)}`);
        }
    }
    async ensureContains() {
        if (this.containsUnavailable && this.containsEnabled && this.dataSource.options.type === 'postgres') {
            await this.probePostgresTrigram();
        }
        if (this.containsUnavailable)
            throw new common_1.NotImplementedException(this.containsUnavailable);
    }
    async search(query) {
        if (query.match === 'contains')
            return this.searchContains(query);
        await this.ensureFts();
        const start = Date.now();
        const isPostgres = this.dataSource.options.type === 'postgres';
        const limit = Math.max(1, Math.min(query.limit ?? 50, search_constants_1.SEARCH_LIMIT_MAX));
        const offset = Math.max(0, query.offset ?? 0);
        const { sql, params } = isPostgres
            ? this.buildPostgres(query, limit, offset)
            : this.buildSqlite(query, limit, offset);
        const fts5QueryError = /(fts5:\s*syntax\s*error|unterminated\s+string|unknown\s+special\s+query)/i;
        let rows;
        try {
            rows = await this.dataSource.query(sql, params);
        }
        catch (e) {
            if (!isPostgres && fts5QueryError.test(String(e))) {
                throw new common_1.BadRequestException('Malformed search query for SQLite full-text search.');
            }
            throw e;
        }
        const hits = rows.map(r => this.mapRow(r));
        const total = rows.length < limit && offset === 0 ? rows.length : await this.count(query, isPostgres);
        return { hits, total, tookMs: Date.now() - start, provider: this.id };
    }
    async searchContains(query) {
        await this.ensureContains();
        const isPostgres = this.dataSource.options.type === 'postgres';
        const terms = BuiltInFtsProvider_1.containsTermsOf(query.q, isPostgres, this.postgresAsciiTrigrams);
        const start = Date.now();
        const limit = Math.max(1, Math.min(query.limit ?? 50, search_constants_1.SEARCH_LIMIT_MAX));
        const offset = Math.max(0, query.offset ?? 0);
        const { sql, params } = isPostgres
            ? this.buildPostgresCandidates(query, terms)
            : this.buildSqliteCandidates(query, terms);
        const rows = await this.dataSource.query(sql, params);
        const ranked = rows
            .map(row => ({ row, score: (0, search_score_1.containsScore)(row.body ?? '', terms) }))
            .sort((a, b) => b.score - a.score ||
            Number(b.row.timestamp ?? 0) - Number(a.row.timestamp ?? 0) ||
            compareDescending(a.row.id, b.row.id));
        const hits = ranked.slice(offset, offset + limit).map(({ row, score }) => ({
            ...this.mapRow(row),
            snippet: (0, search_snippet_1.containsSnippet)(row.body ?? '', terms, MAX_SNIPPET_WORDS),
            score,
        }));
        return { hits, total: ranked.length, tookMs: Date.now() - start, provider: this.id };
    }
    async health() {
        try {
            const ok = await this.probeFts();
            return { ok, detail: ok ? undefined : 'full-text index absent' };
        }
        catch (e) {
            return { ok: false, detail: e instanceof Error ? e.message : String(e) };
        }
    }
    mapRow(r) {
        return {
            messageId: r.id,
            waMessageId: r.wa_message_id ?? '',
            sessionId: r.session_id,
            chatId: r.chat_id,
            body: r.body ?? '',
            snippet: r.snippet ?? '',
            timestamp: Number(r.timestamp ?? 0),
            type: r.type,
            direction: r.direction,
            from: r.from,
            score: r.score == null ? undefined : Number(r.score),
        };
    }
    static sqlitePlaceholder = () => '?';
    pgPlaceholder() {
        let n = 0;
        return () => `$${++n}`;
    }
    static toFts5Query(raw) {
        const tokens = [...new Set(raw.trim().split(/\s+/).filter(Boolean))];
        if (tokens.length === 0)
            return '""';
        return tokens.map(tok => `"${tok.replace(/"/g, '""')}"`).join(' ');
    }
    static containsTermsOf(q, isPostgres, asciiOnly) {
        const terms = (0, search_terms_1.containsTerms)(q);
        const canIndex = (term) => (isPostgres ? postgresCanIndex(term, asciiOnly) : !isShortTerm(term));
        if (!terms.some(canIndex)) {
            const unit = isPostgres ? `${asciiOnly ? 'ASCII ' : ''}letters or digits in a row` : 'characters';
            throw new search_terms_1.ContainsTermsRefusedError(`A contains search needs at least one term of ${search_constants_1.SEARCH_CONTAINS_MIN_TERM_LENGTH} or more ${unit}.`);
        }
        const length = terms.reduce((sum, term) => sum + [...(0, search_terms_1.foldSearchText)(term)].length, 0);
        if (length > search_constants_1.SEARCH_CONTAINS_TERMS_MAX_LENGTH) {
            throw new search_terms_1.ContainsTermsRefusedError(`The terms of a contains search may hold at most ${search_constants_1.SEARCH_CONTAINS_TERMS_MAX_LENGTH} characters together, spaces not counted.`);
        }
        return terms;
    }
    buildSqlite(q, limit, offset) {
        const ph = BuiltInFtsProvider_1.sqlitePlaceholder;
        const params = [];
        const where = [`messages_fts MATCH ${ph()}`];
        params.push(BuiltInFtsProvider_1.toFts5Query(q.q));
        this.applyFilters(where, params, q, 'm.', ph);
        const scoped = q.chatIds !== undefined || (q.sessionIds?.length ?? 0) > 0;
        const score = scoped ? 'NULL' : 'rank';
        const cols = `m."id", m."waMessageId" AS wa_message_id, m."sessionId" AS session_id, m."chatId" AS chat_id, m."from" AS "from", m."body", m."timestamp", m."type", m."direction", snippet(messages_fts, 0, '<mark>', '</mark>', '…', ${MAX_SNIPPET_WORDS}) AS snippet, ${score} AS score`;
        const sql = `SELECT ${cols} FROM messages_fts JOIN messages m ON m."rowid" = messages_fts."rowid" WHERE ${where.join(' AND ')} ORDER BY rank, m."timestamp" DESC, m."id" DESC LIMIT ${ph()} OFFSET ${ph()}`;
        params.push(limit, offset);
        return { sql, params };
    }
    buildPostgres(q, limit, offset) {
        const ph = this.pgPlaceholder();
        const params = [];
        const ftsTerm = `websearch_to_tsquery('simple', ${ph()}) AS q(query)`;
        params.push(q.q);
        const where = [`m.body_ts @@ q.query`];
        this.applyFilters(where, params, q, 'm.', ph);
        const cols = `m."id", m."waMessageId" AS wa_message_id, m."sessionId" AS session_id, m."chatId" AS chat_id, m."from", m."body", m."timestamp", m."type", m."direction", ts_headline('simple', m."body", q.query, 'MaxFragments=1, MaxWords=${MAX_SNIPPET_WORDS}, StartSel=<mark>, StopSel=</mark>') AS snippet, ts_rank(m.body_ts, q.query) AS score`;
        const sql = `SELECT ${cols} FROM messages m, ${ftsTerm} WHERE ${where.join(' AND ')} ORDER BY score DESC, m."timestamp" DESC, m."id" DESC LIMIT ${ph()} OFFSET ${ph()}`;
        params.push(limit, offset);
        return { sql, params };
    }
    buildSqliteCandidates(q, terms) {
        const ph = BuiltInFtsProvider_1.sqlitePlaceholder;
        const params = [];
        const where = [`${TRIGRAM_INDEX.table} MATCH ${ph()}`];
        params.push(BuiltInFtsProvider_1.toFts5Query(terms.filter(term => !isShortTerm(term)).join(' ')));
        for (const term of terms.filter(isShortTerm)) {
            where.push(`m."body" LIKE ${ph()} ESCAPE '\\'`);
            params.push(likePattern(term));
        }
        this.applyFilters(where, params, q, 'm.', ph);
        const sql = `SELECT ${CONTAINS_COLUMNS} FROM ${TRIGRAM_INDEX.table} JOIN messages m ON m."rowid" = ${TRIGRAM_INDEX.table}."rowid" WHERE ${where.join(' AND ')} ORDER BY ${TRIGRAM_INDEX.table}."rowid" DESC LIMIT ${ph()}`;
        params.push(search_constants_1.SEARCH_CONTAINS_WINDOW);
        return { sql, params };
    }
    buildPostgresCandidates(q, terms) {
        const ph = this.pgPlaceholder();
        const params = [];
        const where = terms.map(term => {
            const placeholder = ph();
            params.push(term);
            return `openwa_unaccent(m."body") ILIKE ${postgresLikePattern(placeholder)}`;
        });
        this.applyFilters(where, params, q, 'm.', ph);
        const sql = `SELECT ${CONTAINS_COLUMNS} FROM messages m WHERE ${where.join(' AND ')} ORDER BY m."createdAt" DESC, m."id" DESC LIMIT ${ph()}`;
        params.push(search_constants_1.SEARCH_CONTAINS_WINDOW);
        return { sql, params };
    }
    applyFilters(where, params, q, prefix, ph) {
        if (q.sessionIds && q.sessionIds.length) {
            const placeholders = q.sessionIds.map(() => ph()).join(',');
            where.push(`${prefix}"sessionId" IN (${placeholders})`);
            params.push(...q.sessionIds);
        }
        if (q.sessionId) {
            where.push(`${prefix}"sessionId" = ${ph()}`);
            params.push(q.sessionId);
        }
        if (q.chatId) {
            if (q.chatIdAliases?.length) {
                const placeholders = q.chatIdAliases.map(() => ph()).join(',');
                where.push(`${prefix}"chatId" IN (${placeholders})`);
                params.push(...q.chatIdAliases);
            }
            else {
                where.push(`${prefix}"chatId" = ${ph()}`);
                params.push(q.chatId);
            }
        }
        if (q.chatIds?.length === 0)
            where.push('1 = 0');
        else if (q.chatIds) {
            const placeholders = q.chatIds.map(() => ph()).join(',');
            where.push(`${prefix}"chatId" IN (${placeholders})`);
            params.push(...q.chatIds);
        }
        if (q.from) {
            if (q.fromAliases?.length) {
                const asSender = q.fromAliases.map(() => ph()).join(',');
                const asAuthor = q.fromAliases.map(() => ph()).join(',');
                where.push(`(${prefix}"from" IN (${asSender}) OR ${prefix}"author" IN (${asAuthor}))`);
                params.push(...q.fromAliases, ...q.fromAliases);
            }
            else {
                where.push(`${prefix}"from" = ${ph()}`);
                params.push(q.from);
            }
        }
        if (q.direction) {
            where.push(`${prefix}"direction" = ${ph()}`);
            params.push(q.direction);
        }
        if (q.type) {
            const types = Array.isArray(q.type) ? q.type : [q.type];
            const placeholders = types.map(() => ph()).join(',');
            where.push(`${prefix}"type" IN (${placeholders})`);
            params.push(...types);
        }
        if (q.dateFrom != null) {
            where.push(`${prefix}"timestamp" >= ${ph()}`);
            params.push(Math.ceil(q.dateFrom / 1000));
        }
        if (q.dateTo != null) {
            where.push(`${prefix}"timestamp" <= ${ph()}`);
            params.push(Math.floor(q.dateTo / 1000));
        }
    }
    async count(q, isPostgres) {
        const where = [];
        const params = [];
        if (isPostgres) {
            const ph = this.pgPlaceholder();
            const ftsTerm = `websearch_to_tsquery('simple', ${ph()}) AS q(query)`;
            params.push(q.q);
            where.push(`m.body_ts @@ q.query`);
            this.applyFilters(where, params, q, 'm.', ph);
            const sql = `SELECT count(*)::int AS n FROM messages m, ${ftsTerm} WHERE ${where.join(' AND ')}`;
            const rows = await this.dataSource.query(sql, params);
            return Number(rows[0]?.n ?? 0);
        }
        const ph = BuiltInFtsProvider_1.sqlitePlaceholder;
        where.push(`messages_fts MATCH ${ph()}`);
        params.push(BuiltInFtsProvider_1.toFts5Query(q.q));
        this.applyFilters(where, params, q, 'm.', ph);
        const sql = `SELECT count(*) AS n FROM messages_fts JOIN messages m ON m."rowid" = messages_fts."rowid" WHERE ${where.join(' AND ')}`;
        const rows = await this.dataSource.query(sql, params);
        return Number(rows[0]?.n ?? 0);
    }
};
exports.BuiltInFtsProvider = BuiltInFtsProvider;
exports.BuiltInFtsProvider = BuiltInFtsProvider = BuiltInFtsProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectDataSource)('data')),
    __param(1, (0, common_1.Optional)()),
    __param(2, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [typeorm_2.DataSource,
        config_1.ConfigService,
        core_1.HttpAdapterHost])
], BuiltInFtsProvider);
//# sourceMappingURL=builtin-fts.provider.js.map