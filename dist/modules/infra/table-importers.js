"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TABLE_IMPORTERS = void 0;
exports.deduplicateArchivedWebhookFailures = deduplicateArchivedWebhookFailures;
const nul_free_transformer_1 = require("../../common/transformers/nul-free.transformer");
const path_safety_1 = require("../../common/utils/path-safety");
const filter_validation_1 = require("../webhook/filters/filter-validation");
function defineTableImporter(importer) {
    return importer;
}
function decodeJsonColumn(value) {
    if (typeof value !== 'string')
        return value;
    try {
        return JSON.parse(value);
    }
    catch {
        return value;
    }
}
function nulFree(value) {
    return nul_free_transformer_1.NulFreeTransformer.to(value);
}
function deduplicateArchivedWebhookFailures(rows) {
    const owners = new Map();
    const identity = (row) => JSON.stringify([row.webhookId, row.idempotencyKey]);
    const timestamp = (value) => new Date(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?$/.test(value) ? `${value.replace(' ', 'T')}Z` : value).getTime();
    const eligible = (row) => row.attempts > 0 &&
        row.idempotencyKey != null &&
        [row.id, row.webhookId, row.sessionId, row.event, row.url, row.lastError, row.createdAt].every(value => value != null);
    for (const row of rows) {
        if (!eligible(row))
            continue;
        const key = identity(row);
        const previous = owners.get(key);
        if (!previous) {
            owners.set(key, row);
            continue;
        }
        const rank = Number(row.payload == null) - Number(previous.payload == null) ||
            previous.attempts - row.attempts ||
            timestamp(previous.createdAt) - timestamp(row.createdAt) ||
            (row.id === previous.id ? 0 : row.id > previous.id ? -1 : 1);
        if (rank < 0)
            owners.set(key, row);
    }
    return rows.filter(row => !eligible(row) || owners.get(identity(row)) === row);
}
const templateNameOwners = new WeakMap();
function firstTemplateWithName(rows, sessionId, name) {
    let owners = templateNameOwners.get(rows);
    if (!owners) {
        owners = new Map();
        for (const row of rows) {
            const key = JSON.stringify([row.sessionId, nulFree(row.name)]);
            if (!owners.has(key))
                owners.set(key, row.id);
        }
        templateNameOwners.set(rows, owners);
    }
    return owners.get(JSON.stringify([sessionId, name]));
}
exports.TABLE_IMPORTERS = [
    defineTableImporter({
        key: 'sessions',
        label: 'session',
        sql: `INSERT INTO sessions (id, name, status, phone, "pushName", config, "proxyUrl", "proxyType", "connectedAt", "lastActiveAt", "createdAt", "updatedAt", "desiredState")
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        id: (session) => session.id,
        skip: (session) => {
            if (!(0, path_safety_1.isSafeSessionName)(session.id)) {
                return `Skipped session ${JSON.stringify(session.id)}: unsafe id`;
            }
            if ((0, path_safety_1.isSafeSessionName)(session.name))
                return null;
            return `Skipped session ${session.id}: unsafe name ${JSON.stringify(session.name)}`;
        },
        map: (session) => [
            session.id,
            session.name,
            session.status,
            session.phone,
            nulFree(session.pushName),
            typeof session.config === 'string' ? session.config : JSON.stringify(session.config || {}),
            session.proxyUrl,
            session.proxyType,
            session.connectedAt,
            session.lastActiveAt,
            session.createdAt,
            session.updatedAt,
            session.desiredState === 'stopped' ||
                session.desiredState === 'deleting' ||
                session.desiredState === 'deleting-stopped'
                ? 'stopped'
                : null,
        ],
    }),
    defineTableImporter({
        key: 'webhooks',
        label: 'webhook',
        sql: `INSERT INTO webhooks (id, "sessionId", url, events, secret, headers, filters, active, "retryCount", "lastTriggeredAt", "createdAt", "updatedAt")
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        id: (webhook) => webhook.id,
        skip: (webhook) => {
            const events = decodeJsonColumn(webhook.events ?? []);
            if (!Array.isArray(events) || !events.every(event => typeof event === 'string')) {
                return `Skipped webhook ${webhook.id}: events is not a list of event names`;
            }
            const filterErrors = (0, filter_validation_1.collectFilterErrors)(decodeJsonColumn(webhook.filters));
            if (filterErrors.length === 0)
                return null;
            return `Skipped webhook ${webhook.id}: invalid filters (${filterErrors.join('; ')})`;
        },
        map: (webhook) => [
            webhook.id,
            webhook.sessionId,
            webhook.url,
            typeof webhook.events === 'string' ? webhook.events : JSON.stringify(webhook.events || []),
            webhook.secret ?? null,
            typeof webhook.headers === 'string' ? webhook.headers : JSON.stringify(webhook.headers || {}),
            webhook.filters == null
                ? null
                : typeof webhook.filters === 'string'
                    ? webhook.filters
                    : JSON.stringify(webhook.filters),
            webhook.active,
            webhook.retryCount,
            webhook.lastTriggeredAt,
            webhook.createdAt,
            webhook.updatedAt,
        ],
    }),
    defineTableImporter({
        key: 'messages',
        label: 'message',
        sql: `INSERT INTO messages (id, "sessionId", "waMessageId", "chatId", "chatName", author, "from", "to", body, type, direction, "timestamp", metadata, status, "createdAt", "mediaPath", "mediaMimetype")
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
        id: (msg) => msg.id,
        map: (msg) => [
            msg.id,
            msg.sessionId,
            msg.waMessageId ?? null,
            msg.chatId,
            nulFree(msg.chatName ?? null),
            msg.author ?? null,
            msg.from,
            msg.to,
            nulFree(msg.body ?? null),
            msg.type,
            msg.direction,
            msg.timestamp ?? null,
            msg.metadata == null ? null : typeof msg.metadata === 'string' ? msg.metadata : JSON.stringify(msg.metadata),
            msg.status,
            msg.createdAt,
            msg.mediaPath ?? null,
            nulFree(msg.mediaMimetype ?? null),
        ],
    }),
    defineTableImporter({
        key: 'messageBatches',
        label: 'message batch',
        sql: `INSERT INTO message_batches (id, batch_id, session_id, status, messages, options, progress, results, current_index, created_at, updated_at, started_at, completed_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        id: (batch) => batch.id,
        map: (batch) => [
            batch.id,
            batch.batch_id,
            batch.session_id,
            batch.status,
            typeof batch.messages === 'string' ? batch.messages : JSON.stringify(batch.messages ?? []),
            batch.options == null ? null : typeof batch.options === 'string' ? batch.options : JSON.stringify(batch.options),
            batch.progress == null
                ? null
                : typeof batch.progress === 'string'
                    ? batch.progress
                    : JSON.stringify(batch.progress),
            batch.results == null ? null : typeof batch.results === 'string' ? batch.results : JSON.stringify(batch.results),
            batch.current_index,
            batch.created_at,
            batch.updated_at,
            batch.started_at,
            batch.completed_at,
        ],
    }),
    defineTableImporter({
        key: 'templates',
        label: 'template',
        sql: `INSERT INTO templates (id, "sessionId", name, body, header, footer, "createdAt", "updatedAt")
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        id: (tpl) => tpl.id,
        skip: (tpl, rows = []) => {
            const name = nulFree(tpl.name);
            const owner = firstTemplateWithName(rows, tpl.sessionId, name);
            if (owner === undefined || owner === tpl.id)
                return null;
            return `Skipped template ${tpl.id}: name ${JSON.stringify(name)} without NUL characters collides with template ${owner} of session ${tpl.sessionId}`;
        },
        map: (tpl) => [
            tpl.id,
            tpl.sessionId,
            nulFree(tpl.name),
            nulFree(tpl.body),
            nulFree(tpl.header ?? null),
            nulFree(tpl.footer ?? null),
            tpl.createdAt,
            tpl.updatedAt,
        ],
    }),
    defineTableImporter({
        key: 'baileysStoredMessages',
        label: 'baileys stored message',
        sql: `INSERT INTO baileys_stored_messages (id, "sessionId", "waMessageId", "serializedMessage", "createdAt")
               VALUES ($1, $2, $3, $4, $5)`,
        id: (bsm) => bsm.id,
        map: (bsm) => [
            bsm.id,
            bsm.sessionId,
            bsm.waMessageId,
            bsm.serializedMessage,
            bsm.createdAt,
        ],
    }),
    defineTableImporter({
        key: 'lidMappings',
        label: 'lid mapping',
        sql: `INSERT INTO lid_mappings (lid, phone, "sessionId", "updatedAt", "isReported") VALUES ($1, $2, $3, $4, $5)`,
        id: (lm) => lm.lid,
        map: (lm) => [
            lm.lid,
            lm.phone ?? null,
            lm.sessionId ?? null,
            lm.updatedAt,
            lm.isReported === true || lm.isReported === 1,
        ],
    }),
    defineTableImporter({
        key: 'chatStates',
        label: 'chat state',
        sql: `INSERT INTO chat_states ("sessionId", "chatId", "muteEndTime", archived, pinned, observed, "deletedAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        id: (cs) => `${cs.sessionId}/${cs.chatId}`,
        map: (cs) => [
            cs.sessionId,
            cs.chatId,
            cs.muteEndTime ?? null,
            cs.archived,
            cs.pinned,
            cs.observed ?? null,
            cs.deletedAt ?? null,
            cs.updatedAt,
        ],
    }),
    defineTableImporter({
        key: 'pluginInstances',
        label: 'plugin instance',
        sql: `INSERT INTO plugin_instances (id, "pluginId", "instanceId", "sessionScope", secret, "verifyToken", config, enabled, "createdAt", "updatedAt")
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        id: (pi) => pi.id,
        map: (pi) => [
            pi.id,
            pi.pluginId,
            pi.instanceId,
            pi.sessionScope,
            pi.secret,
            pi.verifyToken,
            pi.config == null ? null : typeof pi.config === 'string' ? pi.config : JSON.stringify(pi.config),
            pi.enabled,
            pi.createdAt,
            pi.updatedAt,
        ],
    }),
    defineTableImporter({
        key: 'conversationMappings',
        label: 'conversation mapping',
        sql: `INSERT INTO conversation_mappings (id, "sessionId", "chatId", "pluginId", "instanceId", "providerConversationId", "handoverState", metadata, "updatedAt")
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        id: (cm) => cm.id,
        map: (cm) => [
            cm.id,
            cm.sessionId,
            cm.chatId,
            cm.pluginId,
            cm.instanceId,
            cm.providerConversationId,
            cm.handoverState,
            cm.metadata == null ? null : typeof cm.metadata === 'string' ? cm.metadata : JSON.stringify(cm.metadata),
            cm.updatedAt,
        ],
    }),
    defineTableImporter({
        key: 'ingressEvents',
        label: 'ingress event',
        sql: `INSERT INTO ingress_events (id, "instanceId", "pluginId", "providerDeliveryId", route, payload, "payloadHash", "sessionId", "dispatchState", "dispatchAttempts", "lastDispatchAt", "createdAt")
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        id: (ie) => ie.id,
        map: (ie) => [
            ie.id,
            ie.instanceId,
            ie.pluginId,
            ie.providerDeliveryId,
            ie.route,
            ie.payload == null ? null : typeof ie.payload === 'string' ? ie.payload : JSON.stringify(ie.payload),
            ie.payloadHash ?? null,
            ie.sessionId,
            ie.dispatchState ?? null,
            ie.dispatchAttempts ?? 0,
            ie.lastDispatchAt ?? null,
            ie.createdAt,
        ],
    }),
    defineTableImporter({
        key: 'webhookDeliveryFailures',
        label: 'webhook delivery failure',
        sql: `INSERT INTO webhook_delivery_failures (id, "webhookId", "sessionId", event, url, "idempotencyKey", "deliveryId", attempts, "lastStatusCode", "lastError", "createdAt")
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        id: (wf) => wf.id,
        map: (wf) => [
            wf.id,
            wf.webhookId,
            wf.sessionId,
            wf.event,
            wf.url,
            wf.idempotencyKey,
            wf.deliveryId,
            wf.attempts,
            wf.lastStatusCode,
            nulFree(wf.lastError),
            wf.createdAt,
        ],
    }),
    defineTableImporter({
        key: 'webhookOutboxEvents',
        label: 'webhook outbox event',
        sql: `INSERT INTO webhook_outbox_events (id, "webhookId", "sessionId", event, "idempotencyKey", "deliveryId", payload, state, attempts, "lastAttemptAt", "createdAt")
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        id: (row) => row.id,
        map: (row) => [
            row.id,
            row.webhookId,
            row.sessionId,
            row.event,
            row.idempotencyKey,
            row.deliveryId,
            row.payload == null ? null : typeof row.payload === 'string' ? row.payload : JSON.stringify(row.payload),
            row.state,
            row.attempts,
            row.lastAttemptAt,
            row.createdAt,
        ],
    }),
    defineTableImporter({
        key: 'integrationDeliveryFailures',
        label: 'integration delivery failure',
        sql: `INSERT INTO integration_delivery_failures (id, direction, "pluginId", "instanceId", "sessionId", "deliveryId", attempts, "lastError", payload, redriven, "createdAt")
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        id: (df) => df.id,
        map: (df) => [
            df.id,
            df.direction,
            df.pluginId,
            df.instanceId,
            df.sessionId,
            df.deliveryId,
            df.attempts,
            nulFree(df.lastError),
            df.payload == null ? null : typeof df.payload === 'string' ? df.payload : JSON.stringify(df.payload),
            df.redriven,
            df.createdAt,
        ],
    }),
    defineTableImporter({
        key: 'statusUpdates',
        label: 'status update',
        sql: `INSERT INTO status_updates (id, "sessionId", "contactJid", "contactName", "contactPushName", "waStatusId", type, caption, "mediaPath", "mediaMimetype", "mediaOmitted", "omitReason", "backgroundColor", font, "postedAt", "expiresAt")
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        id: (su) => su.id,
        map: (su) => [
            su.id,
            su.sessionId,
            su.contactJid,
            nulFree(su.contactName ?? null),
            nulFree(su.contactPushName ?? null),
            su.waStatusId,
            su.type,
            nulFree(su.caption ?? null),
            su.mediaPath ?? null,
            nulFree(su.mediaMimetype ?? null),
            su.mediaOmitted ?? false,
            su.omitReason ?? null,
            su.backgroundColor ?? null,
            su.font ?? null,
            su.postedAt,
            su.expiresAt,
        ],
    }),
    defineTableImporter({
        key: 'automationRules',
        label: 'automation rule',
        sql: `INSERT INTO automation_rules (id, "sessionId", name, enabled, conditions, "replyText", "cooldownSeconds", "createdAt", "updatedAt")
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        id: (rule) => rule.id,
        skip: (rule) => {
            const errors = (0, filter_validation_1.collectFilterErrors)(decodeJsonColumn(rule.conditions));
            if (errors.length === 0)
                return null;
            return `Skipped automation rule ${rule.id}: invalid conditions (${errors.join('; ')})`;
        },
        map: (rule) => [
            rule.id,
            rule.sessionId,
            nulFree(rule.name),
            rule.enabled ?? true,
            rule.conditions == null
                ? null
                : typeof rule.conditions === 'string'
                    ? rule.conditions
                    : JSON.stringify(rule.conditions),
            nulFree(rule.replyText),
            rule.cooldownSeconds ?? 60,
            rule.createdAt,
            rule.updatedAt,
        ],
    }),
];
const EXPECTED_TABLE_KEYS = [
    'sessions',
    'webhooks',
    'messages',
    'messageBatches',
    'templates',
    'baileysStoredMessages',
    'lidMappings',
    'chatStates',
    'pluginInstances',
    'conversationMappings',
    'ingressEvents',
    'webhookDeliveryFailures',
    'webhookOutboxEvents',
    'integrationDeliveryFailures',
    'statusUpdates',
    'automationRules',
];
const importerKeys = exports.TABLE_IMPORTERS.map(importer => importer.key);
for (const key of EXPECTED_TABLE_KEYS) {
    if (!importerKeys.includes(key))
        throw new Error(`table-importers: missing descriptor for "${key}"`);
}
if (importerKeys.length !== EXPECTED_TABLE_KEYS.length) {
    throw new Error(`table-importers: expected ${EXPECTED_TABLE_KEYS.length} descriptors, found ${importerKeys.length}`);
}
//# sourceMappingURL=table-importers.js.map