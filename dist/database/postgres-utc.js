"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.utcTimestampTypes = void 0;
exports.parseTimestampAsUtc = parseTimestampAsUtc;
exports.postgresUtcExtra = postgresUtcExtra;
exports.assertDataConnectionUtc = assertDataConnectionUtc;
const pg_1 = require("pg");
const TIMESTAMP_OID = 1114;
const TIMESTAMPTZ_OID = 1184;
const parseNaiveTimestamp = pg_1.types.getTypeParser(TIMESTAMP_OID, 'text');
const parseZonedTimestamp = pg_1.types.getTypeParser(TIMESTAMPTZ_OID, 'text');
const NAIVE_TIMESTAMP = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?$/;
function parseTimestampAsUtc(value) {
    return NAIVE_TIMESTAMP.test(value) ? parseZonedTimestamp(`${value}+00`) : parseNaiveTimestamp(value);
}
exports.utcTimestampTypes = {
    getTypeParser(oid, format) {
        if (oid === TIMESTAMP_OID && (format ?? 'text') === 'text')
            return parseTimestampAsUtc;
        return pg_1.types.getTypeParser(oid, format);
    },
};
const SET_SESSION_UTC = "SET TIME ZONE 'UTC'";
const DEFAULT_CONNECTION_TIMEOUT_MS = 10_000;
const pinSessionToUtc = (client, timeoutMs = DEFAULT_CONNECTION_TIMEOUT_MS, text = SET_SESSION_UTC) => {
    const query = { text, query_timeout: timeoutMs };
    return client.query(query);
};
function sessionStatements({ statementTimeoutMs, searchPath }) {
    const statements = [SET_SESSION_UTC];
    const timeout = parseInt(String(statementTimeoutMs ?? ''), 10);
    if (timeout)
        statements.push(`SET statement_timeout = ${timeout}`);
    if (searchPath)
        statements.push(`SELECT set_config('search_path', '${searchPath.replace(/'/g, "''")}', false)`);
    return statements.join('; ');
}
function postgresUtcExtra(connectionTimeoutMillis, settings = {}) {
    pg_1.defaults.parseInputDatesAsUTC = true;
    const timeoutMs = connectionTimeoutMillis && Number.isFinite(connectionTimeoutMillis) && connectionTimeoutMillis > 0
        ? connectionTimeoutMillis
        : DEFAULT_CONNECTION_TIMEOUT_MS;
    const text = sessionStatements(settings);
    return {
        types: exports.utcTimestampTypes,
        onConnect: timeoutMs === DEFAULT_CONNECTION_TIMEOUT_MS && text === SET_SESSION_UTC
            ? pinSessionToUtc
            : client => pinSessionToUtc(client, timeoutMs, text),
    };
}
async function assertDataConnectionUtc(dataSource) {
    const effectiveZone = await dataSource.query(`SELECT current_setting('TimeZone') AS zone,
              EXTRACT(TIMEZONE FROM now())::int AS offset_seconds,
              EXTRACT(TIMEZONE FROM now() + interval '6 months')::int AS offset_seconds_later`);
    const [effective] = effectiveZone;
    if (effective?.offset_seconds === 0 && effective.offset_seconds_later === 0)
        return;
    throw new Error(`PostgreSQL data connection is not on UTC: TimeZone is "${effective?.zone}" ` +
        `(offset ${effective?.offset_seconds}s now, ${effective?.offset_seconds_later}s in six months; a zone that ` +
        `observes daylight saving is not UTC even while it reads +00). OpenWA stores every timestamp column in UTC. ` +
        `Set the server default to UTC (ALTER DATABASE "<database>" SET TimeZone='UTC'), or let the connection's own ` +
        `"SET TIME ZONE 'UTC'" through the pooler.`);
}
//# sourceMappingURL=postgres-utc.js.map