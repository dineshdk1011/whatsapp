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
Object.defineProperty(exports, "__esModule", { value: true });
exports.InfraDataService = void 0;
exports.restoreSessionOwnership = restoreSessionOwnership;
exports.sqliteDatetimeColumns = sqliteDatetimeColumns;
exports.toSqliteDatetime = toSqliteDatetime;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("typeorm");
const typeorm_2 = require("@nestjs/typeorm");
const logger_service_1 = require("../../common/services/logger.service");
const db_errors_1 = require("../../common/utils/db-errors");
const session_write_scope_1 = require("../../common/utils/session-write-scope");
const shared_connection_1 = require("../../common/utils/shared-connection");
const batch_media_util_1 = require("../message/batch-media.util");
const audit_service_1 = require("../audit/audit.service");
const audit_log_entity_1 = require("../audit/entities/audit-log.entity");
const session_service_1 = require("../session/session.service");
const lid_mapping_store_service_1 = require("../../engine/identity/lid-mapping-store.service");
const baileys_chat_state_store_service_1 = require("../../engine/adapters/baileys-chat-state-store.service");
const session_ownership_service_1 = require("../session/session-ownership.service");
const scope_binding_service_1 = require("../integration/scope-binding.service");
const _1786500000000_ReKeyChatStatesBySessionId_1 = require("../../database/migrations/1786500000000-ReKeyChatStatesBySessionId");
const _1786900000000_ScrubRevokedMessageContent_1 = require("../../database/migrations/1786900000000-ScrubRevokedMessageContent");
const _1786950000000_ScrubNonPhoneLidMappings_1 = require("../../database/migrations/1786950000000-ScrubNonPhoneLidMappings");
const _1791300000000_BackfillLegacyMessageTypes_1 = require("../../database/migrations/1791300000000-BackfillLegacyMessageTypes");
const session_entity_1 = require("../session/entities/session.entity");
const typeorm_3 = require("typeorm");
const DateUtils_1 = require("typeorm/util/DateUtils");
const export_tables_1 = require("./export-tables");
const table_importers_1 = require("./table-importers");
async function readSessionOwnership(queryRunner) {
    if (!(await queryRunner.hasColumn('sessions', 'nodeId')))
        return null;
    return (await queryRunner.query('SELECT id, "nodeId", "claimedAt", "leaseExpiresAt", "nodeUrl" FROM sessions WHERE "nodeId" IS NOT NULL'));
}
function carryLease(raw, readAt, now) {
    if (!(raw instanceof Date) && typeof raw !== 'string')
        return raw;
    if (typeof raw === 'string' && !raw.endsWith('Z'))
        return raw;
    const deadline = raw instanceof Date ? raw : new Date(raw);
    const remainingMs = deadline.getTime() - readAt.getTime();
    if (Number.isNaN(remainingMs) || remainingMs <= 0)
        return raw;
    const carried = new Date(Math.max(now.getTime() + remainingMs, deadline.getTime()));
    if (!Number.isFinite(carried.getTime()))
        return raw;
    return raw instanceof Date ? carried : carried.toISOString();
}
async function restoreSessionOwnership(preserved, insert, readAt, now = new Date()) {
    if (!preserved?.length)
        return;
    for (const row of preserved) {
        await insert('UPDATE sessions SET "nodeId" = $1, "claimedAt" = $2, "leaseExpiresAt" = $3, "nodeUrl" = $4 WHERE id = $5', [row.nodeId, row.claimedAt, carryLease(row.leaseExpiresAt, readAt, now), row.nodeUrl, row.id]);
    }
}
function sqliteDatetimeColumns(dataSource) {
    const byTable = new Map(dataSource.entityMetadatas.map(metadata => [
        metadata.tableName,
        metadata.columns
            .filter(column => dataSource.driver.normalizeType(column) === 'datetime')
            .map(column => column.databaseName),
    ]));
    return new Map(export_tables_1.EXPORT_TABLES.map(entry => [entry.key, byTable.get(entry.table) ?? []]));
}
function toSqliteDatetime(value) {
    if (typeof value !== 'string' || !/T.*(Z|[+-]\d{2}:?\d{2})$/i.test(value))
        return value;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : DateUtils_1.DateUtils.mixedDateToUtcDatetimeString(date);
}
const DEFAULT_EXPORT_INLINE_MEDIA_BUDGET_BYTES = 8 * 1024 * 1024;
function exportInlineMediaBudgetBytes() {
    const parsed = Number.parseInt(process.env.EXPORT_INLINE_MEDIA_BUDGET_BYTES ?? '', 10);
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : DEFAULT_EXPORT_INLINE_MEDIA_BUDGET_BYTES;
}
function newestFirst(rows, at) {
    const key = (row) => {
        const value = at(row);
        return Number.isFinite(value) ? value : 0;
    };
    return [...rows].sort((a, b) => key(b) - key(a));
}
const EXPORT_READ_CHUNK_MIN_BYTES = 1024 * 1024;
const EXPORT_READ_CHUNK_MAX_ROWS = 200;
function createInlineMediaBudget() {
    const budget = exportInlineMediaBudgetBytes();
    let spent = 0;
    let dropped = 0;
    return {
        bytes: budget,
        exceeds: (encodedBytes) => {
            if (spent + encodedBytes > budget) {
                dropped += 1;
                return true;
            }
            spent += encodedBytes;
            return false;
        },
        droppedPayloads: () => dropped,
    };
}
const EMPTY_ARCHIVE_WARNING = 'Backup contained no rows to restore; refused to replace existing data. Check the file.';
let InfraDataService = class InfraDataService {
    configService;
    dataDataSource;
    auditService;
    sessionService;
    lidMappingStore;
    ownership;
    chatStateStore;
    moduleRef;
    logger = (0, logger_service_1.createLogger)('InfraDataService');
    importInFlight = false;
    exportsInFlight = 0;
    constructor(configService, dataDataSource, auditService, sessionService, lidMappingStore, ownership, chatStateStore, moduleRef) {
        this.configService = configService;
        this.dataDataSource = dataDataSource;
        this.auditService = auditService;
        this.sessionService = sessionService;
        this.lidMappingStore = lidMappingStore;
        this.ownership = ownership;
        this.chatStateStore = chatStateStore;
        this.moduleRef = moduleRef;
    }
    assertExportRegistryMatchesMetadata() {
        const metadataTables = new Set(this.dataDataSource.entityMetadatas.map(metadata => metadata.tableName));
        for (const entry of export_tables_1.EXPORT_TABLES) {
            if (!metadataTables.has(entry.table)) {
                throw new Error(`export-data: table "${entry.table}" (backup key "${entry.key}") is registered for export, but the ` +
                    `data connection's entity metadata does not know it — a renamed or dropped entity must be ` +
                    `updated in export-tables.ts, never exported around`);
            }
        }
        const registryTables = new Set(export_tables_1.EXPORT_TABLES.map(entry => entry.table));
        for (const table of metadataTables) {
            if (registryTables.has(table) || table in export_tables_1.EXPORT_TABLE_EXCLUSIONS)
                continue;
            throw new Error(`export-data: data entity table "${table}" has no backup decision — add it to EXPORT_TABLES (with its ` +
                `import descriptor and the published tables/counts DTO keys) or to EXPORT_TABLE_EXCLUSIONS with a ` +
                `reason, in export-tables.ts`);
        }
    }
    async exportData() {
        this.assertExportRegistryMatchesMetadata();
        if (this.importInFlight) {
            throw new common_1.ConflictException({
                statusCode: 409,
                error: 'Conflict',
                message: 'A data import is running; export after it finishes.',
                code: 'IMPORT_ALREADY_RUNNING',
            });
        }
        this.exportsInFlight++;
        try {
            return await this.runExport();
        }
        finally {
            this.exportsInFlight--;
        }
    }
    async runExport() {
        const skippedTables = [];
        const readTable = async (entry, sql) => {
            try {
                return await this.dataDataSource.query(sql);
            }
            catch (error) {
                if (!entry.optional || !(0, db_errors_1.isMissingTableError)(error))
                    throw error;
                skippedTables.push(entry.table);
                this.logger.warn('Optional table does not exist in this DB; exporting without it', { table: entry.table });
                return [];
            }
        };
        const inlineMediaBudget = createInlineMediaBudget();
        const droppedByBucket = { messages: 0, messageBatches: 0 };
        const tables = {};
        const counts = {};
        for (const entry of export_tables_1.EXPORT_TABLES) {
            const droppedBefore = inlineMediaBudget.droppedPayloads();
            const rows = entry.inlineMedia
                ? await this.readInlineMediaTable(entry, entry.inlineMedia, sql => readTable(entry, sql), inlineMediaBudget)
                : await readTable(entry, `SELECT ${entry.columns?.map(column => `"${column}"`).join(', ') ?? '*'} FROM ${entry.table}`);
            entry.afterRead?.(rows);
            if (entry.inlineMedia) {
                droppedByBucket[entry.inlineMedia.bucket] = inlineMediaBudget.droppedPayloads() - droppedBefore;
            }
            tables[entry.key] = rows;
            counts[entry.key] = rows.length;
        }
        const exportedSessions = new Set(tables.sessions.map(session => session.id));
        for (const entry of export_tables_1.EXPORT_TABLES) {
            if (!entry.sessionFk)
                continue;
            const kept = tables[entry.key].filter(row => exportedSessions.has(row.sessionId));
            tables[entry.key] = kept;
            counts[entry.key] = kept.length;
        }
        await this.auditService?.logInfo(audit_log_entity_1.AuditAction.INFRA_DATA_EXPORTED, { metadata: { counts } });
        return {
            exportedAt: new Date().toISOString(),
            dataDbType: this.configService.get('dataDatabase.type', 'sqlite'),
            tables,
            counts,
            skippedTables,
            omittedInlineMedia: droppedByBucket,
        };
    }
    async readInlineMediaTable(entry, media, readKeys, budget) {
        const keys = (await readKeys(`SELECT id, "${media.recencyColumn}", OCTET_LENGTH("${media.payloadColumn}") AS "payloadBytes" FROM ${entry.table}`));
        const chunkLimit = Math.max(budget.bytes, EXPORT_READ_CHUNK_MIN_BYTES);
        const stripped = new Map();
        let chunk = [];
        let chunkBytes = 0;
        const flush = async () => {
            const isPostgres = this.dataDataSource.options.type === 'postgres';
            const placeholders = chunk.map((_, i) => (isPostgres ? `$${i + 1}` : '?')).join(', ');
            const rows = await this.dataDataSource.query(`SELECT * FROM ${entry.table} WHERE id IN (${placeholders})`, chunk);
            const byId = new Map(rows.map(row => [row.id, row]));
            for (const id of chunk) {
                const row = byId.get(id);
                if (!row)
                    continue;
                media.strip(row, budget.exceeds);
                stripped.set(id, row);
            }
            chunk = [];
            chunkBytes = 0;
        };
        for (const key of newestFirst(keys, media.newestFirst)) {
            const bytes = Number(key.payloadBytes) || 0;
            const full = chunk.length === EXPORT_READ_CHUNK_MAX_ROWS || chunkBytes + bytes > chunkLimit;
            if (chunk.length > 0 && full)
                await flush();
            chunk.push(key.id);
            chunkBytes += bytes;
        }
        if (chunk.length > 0)
            await flush();
        return keys.filter(key => stripped.has(key.id)).map(key => stripped.get(key.id));
    }
    async importData(data) {
        if (this.importInFlight) {
            throw new common_1.ConflictException({
                statusCode: 409,
                error: 'Conflict',
                message: 'A data import is already running; wait for it to finish before starting another.',
                code: 'IMPORT_ALREADY_RUNNING',
            });
        }
        if (this.exportsInFlight > 0) {
            throw new common_1.ConflictException({
                statusCode: 409,
                error: 'Conflict',
                message: 'A data export is running; import after it finishes.',
                code: 'EXPORT_IN_PROGRESS',
            });
        }
        this.importInFlight = true;
        try {
            return await this.runImport(data);
        }
        finally {
            this.importInFlight = false;
        }
    }
    async runImport(data) {
        const warnings = [];
        for (const [table, rows] of Object.entries(data.tables ?? {})) {
            if (rows === undefined)
                continue;
            if (!Array.isArray(rows)) {
                throw new common_1.BadRequestException(`tables.${table} must be an array of rows`);
            }
            const badRow = rows.findIndex(row => typeof row !== 'object' || row === null || Array.isArray(row));
            if (badRow !== -1) {
                throw new common_1.BadRequestException(`tables.${table}[${badRow}] must be a row object`);
            }
        }
        const refusals = table_importers_1.TABLE_IMPORTERS.every(importer => !data.tables[importer.key]?.length)
            ? [EMPTY_ARCHIVE_WARNING]
            : table_importers_1.TABLE_IMPORTERS.flatMap(importer => (data.tables[importer.key] ?? [])
                .map((row, _index, rows) => importer.skip?.(row, rows))
                .filter((warning) => warning != null));
        if (refusals.length > 0) {
            return {
                imported: false,
                counts: Object.fromEntries(table_importers_1.TABLE_IMPORTERS.map(importer => [importer.key, 0])),
                warnings: refusals,
                notices: [],
                restartRequired: false,
                orphanedEngines: [],
                stoppedOrphanEngines: [],
                failedOrphanEngines: [],
            };
        }
        const importedSessionIds = new Set((data.tables.sessions ?? []).map(s => s.id));
        const orphanedEngines = (this.sessionService?.getActiveSessionIds() ?? []).filter(id => !importedSessionIds.has(id));
        let stoppedOrphanEngines = [];
        let failedOrphanEngines = [];
        let restartRequired = false;
        const notices = [];
        const heldElsewhere = (await this.ownership?.heldByOtherNodes()) ?? [];
        if (heldElsewhere.length > 0) {
            restartRequired = true;
            notices.push(`${heldElsewhere.length} session(s) are running on another node and could not be reconciled from ` +
                `this request: ${heldElsewhere.join(', ')}. Their engines may still write into the restored ` +
                `tables — stop those nodes before relying on this import.`);
        }
        if (orphanedEngines.length > 0 && data.stopOrphans && this.sessionService) {
            const result = await this.sessionService.stopOrphanEngines(orphanedEngines);
            stoppedOrphanEngines = result.stopped;
            failedOrphanEngines = result.failed;
            for (const sessionId of result.stopped) {
                await this.auditService?.logInfo(audit_log_entity_1.AuditAction.SESSION_STOPPED, {
                    sessionId,
                    metadata: { via: 'infra_import_data' },
                });
            }
            if (failedOrphanEngines.length > 0) {
                restartRequired = true;
                notices.push(`Teardown failed for ${failedOrphanEngines.length} orphan engine(s): ${failedOrphanEngines.join(', ')} ` +
                    `(removed from the engine registry; a process restart guarantees cleanup).`);
            }
            if (result.notRunning.length > 0) {
                notices.push(`${result.notRunning.length} orphan session(s) had no live engine yet (initializing or waiting to ` +
                    `reconnect): ${result.notRunning.join(', ')}; they will not start.`);
            }
        }
        else if (orphanedEngines.length > 0 && !data.force) {
            throw new common_1.ConflictException({
                statusCode: 409,
                error: 'Conflict',
                message: `Import would orphan ${orphanedEngines.length} running engine(s) for session(s) ` +
                    `${orphanedEngines.join(', ')} that the backup does not contain. Stop them first, retry with ` +
                    `stopOrphans=true (stops them inside this request), or retry with force=true ` +
                    `(a server restart is then required to stop the orphaned engines).`,
                code: 'IMPORT_WOULD_ORPHAN_ENGINES',
            });
        }
        else if (orphanedEngines.length > 0 && data.force) {
            restartRequired = true;
        }
        const engineStateAfterRollback = {
            restartRequired: failedOrphanEngines.length > 0,
            orphanedEngines,
            stoppedOrphanEngines,
            failedOrphanEngines,
        };
        const sharesOneConnection = shared_connection_1.SHARED_CONNECTION_DIALECTS.has(this.dataDataSource.options.type);
        const resumeLossDetection = sharesOneConnection ? this.ownership?.suspendLossDetection() : undefined;
        const leftRunning = new Set([...heldElsewhere, ...(data.stopOrphans ? [] : orphanedEngines)]);
        let retired = [];
        let committed = false;
        let foreignTransaction = false;
        try {
            const queryRunner = this.dataDataSource.createQueryRunner();
            const refuseNestedTransaction = () => {
                if (queryRunner.isTransactionActive) {
                    throw new common_1.ConflictException({
                        statusCode: 409,
                        error: 'Conflict',
                        message: 'Another database transaction is in progress on this connection, so a restore could not be ' +
                            'made durable. Retry with no other data operation in flight.',
                        code: 'IMPORT_NESTED_TRANSACTION',
                    });
                }
            };
            try {
                refuseNestedTransaction();
                const existing = await this.dataDataSource.query('SELECT id FROM sessions', [], sharesOneConnection ? queryRunner : undefined);
                retired = existing
                    .filter(({ id }) => !importedSessionIds.has(id) && !leftRunning.has(id))
                    .map(({ id }) => ({ id, writes: (0, session_write_scope_1.closeSessionWrites)(this.dataDataSource, id) }));
                await Promise.all(retired.map(({ writes }) => writes.drain()));
                await queryRunner.connect();
                if (queryRunner.isTransactionActive)
                    foreignTransaction = true;
                refuseNestedTransaction();
                await queryRunner.startTransaction();
            }
            catch (error) {
                await queryRunner.release().catch(() => undefined);
                throw error;
            }
            try {
                const isPostgres = this.dataDataSource.options.type === 'postgres';
                if (isPostgres) {
                    const lockWaitMs = Math.max(0, Math.trunc(this.configService.get('dataDatabase.statementTimeoutMs', 30000)) || 0);
                    await queryRunner.query('SET LOCAL statement_timeout = 0');
                    await queryRunner.query(`SET LOCAL lock_timeout = ${lockWaitMs}`);
                }
                const clearTable = async (table, where = '') => {
                    if (isPostgres && !(await queryRunner.hasTable(table))) {
                        this.logger.debug('Skipped clearing a table that does not exist during import', { table });
                        return;
                    }
                    try {
                        await queryRunner.query(`DELETE FROM ${table}${where}`);
                    }
                    catch (err) {
                        if (isPostgres || !(0, db_errors_1.isMissingTableError)(err))
                            throw err;
                        this.logger.debug('Skipped clearing a table that does not exist during import', { table });
                    }
                };
                const insert = (text, params) => queryRunner.query(isPostgres ? text : text.replace(/\$\d+/g, '?'), isPostgres ? params : params.map(v => (typeof v === 'boolean' ? Number(v) : (v ?? null))));
                await queryRunner.query('DELETE FROM webhooks');
                await clearTable('messages');
                await clearTable('message_batches');
                await clearTable('templates');
                await clearTable('baileys_stored_messages');
                await clearTable('lid_mappings');
                await clearTable('chat_states');
                const previousPluginBindings = (await queryRunner.hasTable('plugin_instances'))
                    ? (await queryRunner.query('SELECT "pluginId", "sessionScope", enabled FROM plugin_instances')).map(row => ({ ...row, enabled: Number(row.enabled) === 1 }))
                    : [];
                await clearTable('plugin_instances');
                await clearTable('conversation_mappings');
                await clearTable('ingress_events');
                await clearTable('webhook_delivery_failures');
                await clearTable('webhook_outbox_events');
                await clearTable('integration_delivery_failures');
                await clearTable('status_updates');
                const preservedOwnership = await readSessionOwnership(queryRunner);
                const ownershipReadAt = new Date();
                await queryRunner.query('DELETE FROM sessions');
                const counts = Object.fromEntries(table_importers_1.TABLE_IMPORTERS.map(importer => [importer.key, 0]));
                const datetimeColumns = isPostgres ? undefined : sqliteDatetimeColumns(this.dataDataSource);
                restore: for (const importer of table_importers_1.TABLE_IMPORTERS) {
                    const rows = importer.key === 'webhookDeliveryFailures'
                        ? (0, table_importers_1.deduplicateArchivedWebhookFailures)(data.tables.webhookDeliveryFailures ?? [])
                        : data.tables[importer.key];
                    if (!rows?.length)
                        continue;
                    const dateColumns = datetimeColumns?.get(importer.key) ?? [];
                    for (const archivedRow of rows) {
                        const source = archivedRow;
                        const untypedRow = {
                            ...source,
                            ...Object.fromEntries(dateColumns
                                .filter(column => column in source)
                                .map(column => [column, toSqliteDatetime(source[column])])),
                        };
                        const row = untypedRow;
                        const skipWarning = importer.skip?.(row, rows);
                        if (skipWarning != null) {
                            warnings.push(skipWarning);
                            continue;
                        }
                        try {
                            await insert(importer.sql, importer.map(row));
                            counts[importer.key]++;
                        }
                        catch (err) {
                            warnings.push(`Failed to import ${importer.label} ${importer.id(row)}: ${err instanceof Error ? err.message : String(err)}`);
                            if (isPostgres)
                                break restore;
                        }
                    }
                }
                if (warnings.length === 0) {
                    try {
                        await restoreSessionOwnership(preservedOwnership, insert, ownershipReadAt);
                    }
                    catch (error) {
                        warnings.push(`Failed to restore session ownership: ${error instanceof Error ? error.message : String(error)}`);
                    }
                }
                if (warnings.length === 0) {
                    try {
                        if (await queryRunner.hasTable('chat_states')) {
                            await queryRunner.query(_1786500000000_ReKeyChatStatesBySessionId_1.ReKeyChatStatesBySessionId1786500000000.rekey('name', 'id', { skipAlreadyKeyed: true }));
                        }
                    }
                    catch (error) {
                        warnings.push(`Failed to re-key chat states: ${error instanceof Error ? error.message : String(error)}`);
                    }
                }
                if (warnings.length === 0) {
                    try {
                        await _1786900000000_ScrubRevokedMessageContent_1.ScrubRevokedMessageContent1786900000000.scrub(queryRunner);
                        await _1786950000000_ScrubNonPhoneLidMappings_1.ScrubNonPhoneLidMappings1786950000000.scrub(queryRunner);
                        await _1791300000000_BackfillLegacyMessageTypes_1.BackfillLegacyMessageTypes1791300000000.backfill(queryRunner);
                    }
                    catch (error) {
                        warnings.push(`Failed to clean restored rows: ${error instanceof Error ? error.message : String(error)}`);
                    }
                }
                if (warnings.length === 0 && (await queryRunner.hasTable('send_idempotency_keys'))) {
                    try {
                        await clearTable('send_idempotency_keys', ' WHERE "sessionId" NOT IN (SELECT CAST("id" AS TEXT) FROM sessions)');
                    }
                    catch (error) {
                        warnings.push(`Failed to drop the send idempotency claims of removed sessions: ${error instanceof Error ? error.message : String(error)}`);
                    }
                }
                if (warnings.length > 0) {
                    await queryRunner.rollbackTransaction();
                    return {
                        imported: false,
                        counts,
                        warnings,
                        notices,
                        ...engineStateAfterRollback,
                    };
                }
                const ACTIVE_STATUSES = [
                    session_entity_1.SessionStatus.READY,
                    session_entity_1.SessionStatus.INITIALIZING,
                    session_entity_1.SessionStatus.QR_READY,
                    session_entity_1.SessionStatus.AUTHENTICATING,
                    session_entity_1.SessionStatus.ACTION_REQUIRED,
                ];
                const claimable = this.ownership?.claimableWhere() ?? [{}];
                const normalized = claimable.length === 0
                    ? { affected: 0 }
                    : await queryRunner.manager.getRepository(session_entity_1.Session).update(claimable.map(clause => ({ ...clause, status: (0, typeorm_3.In)(ACTIVE_STATUSES) })), { status: session_entity_1.SessionStatus.DISCONNECTED });
                if (normalized.affected && normalized.affected > 0) {
                    notices.push(`${normalized.affected} imported session(s) carried an active status (the source host's engines): ` +
                        'restored as disconnected - start them via POST /api/sessions/:id/start or let auto-start adopt them.');
                }
                const totalRestored = Object.values(counts).reduce((sum, n) => sum + n, 0);
                if (totalRestored === 0) {
                    await queryRunner.rollbackTransaction();
                    return {
                        imported: false,
                        counts,
                        warnings: [EMPTY_ARCHIVE_WARNING],
                        notices,
                        ...engineStateAfterRollback,
                    };
                }
                await queryRunner.commitTransaction();
                committed = true;
                await this.lidMappingStore?.reload();
                await this.chatStateStore?.reload();
                if (this.moduleRef) {
                    try {
                        await this.moduleRef.get(scope_binding_service_1.ScopeBindingService, { strict: false }).resyncAfterImport(previousPluginBindings);
                    }
                    catch (error) {
                        restartRequired = true;
                        notices.push(`Plugin instance bindings could not be re-applied after the restore ` +
                            `(${error instanceof Error ? error.message : String(error)}): check each plugin's active sessions ` +
                            `and per-session config (GET /api/plugins/:id, PUT /api/plugins/:id/sessions) against its restored instances.`);
                    }
                }
                await this.auditService?.logInfo(audit_log_entity_1.AuditAction.INFRA_DATA_IMPORTED, { metadata: { counts } });
                return {
                    imported: true,
                    counts,
                    warnings,
                    notices,
                    restartRequired,
                    orphanedEngines,
                    stoppedOrphanEngines,
                    failedOrphanEngines,
                };
            }
            catch (error) {
                await queryRunner.rollbackTransaction();
                throw error;
            }
            finally {
                await queryRunner.release();
            }
        }
        finally {
            if (foreignTransaction && retired.length > 0 && !(await (0, shared_connection_1.awaitNoOpenTransaction)(this.dataDataSource))) {
                this.logger.warn('Failing the unfinished batches of a refused import inside another open transaction', {
                    action: 'infra_import_foreign_transaction_open',
                    sessionIds: retired.map(({ id }) => id),
                });
            }
            for (const { id } of committed ? [] : retired) {
                await (0, batch_media_util_1.failUnfinishedSessionBatches)(this.dataDataSource, id).catch((error) => this.logger.warn(`Could not fail the unfinished batches of session ${id} after an import that did not commit`, {
                    sessionId: id,
                    action: 'infra_import_batch_fail_failed',
                    error: error instanceof Error ? error.message : String(error),
                }));
            }
            for (const { writes } of retired)
                writes.release();
            resumeLossDetection?.();
        }
    }
};
exports.InfraDataService = InfraDataService;
exports.InfraDataService = InfraDataService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_2.InjectDataSource)('data')),
    __param(2, (0, common_1.Optional)()),
    __param(3, (0, common_1.Optional)()),
    __param(4, (0, common_1.Optional)()),
    __param(5, (0, common_1.Optional)()),
    __param(6, (0, common_1.Optional)()),
    __param(7, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [config_1.ConfigService,
        typeorm_1.DataSource,
        audit_service_1.AuditService,
        session_service_1.SessionService,
        lid_mapping_store_service_1.LidMappingStoreService,
        session_ownership_service_1.SessionOwnershipService,
        baileys_chat_state_store_service_1.ChatStateStoreService,
        core_1.ModuleRef])
], InfraDataService);
//# sourceMappingURL=infra-data.service.js.map