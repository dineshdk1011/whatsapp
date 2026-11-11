"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EXPORT_TABLE_EXCLUSIONS = exports.EXPORT_TABLES = void 0;
const template_render_1 = require("../../common/utils/template-render");
function isMediaPointer(data) {
    return /^https?:\/\//i.test(data);
}
function redactWebhookCredentials(rows) {
    for (const row of rows) {
        delete row.secret;
        delete row.headers;
    }
}
function stripWebhookFailurePayload(rows) {
    for (const row of rows) {
        delete row.payload;
    }
}
function redactSessionProxyCredentials(rows) {
    for (const row of rows) {
        if (!row.proxyUrl)
            continue;
        try {
            const parsed = new URL(row.proxyUrl);
            if (!parsed.username && !parsed.password)
                continue;
            parsed.username = '';
            parsed.password = '';
            row.proxyUrl = parsed.toString();
        }
        catch {
            row.proxyUrl = null;
        }
    }
}
function stripBodyTs(rows) {
    for (const row of rows) {
        delete row.body_ts;
    }
}
function stripInlineMediaPayload(row, exceedsBudget) {
    const raw = row.metadata;
    if (typeof raw !== 'string')
        return;
    let parsed;
    try {
        parsed = JSON.parse(raw);
    }
    catch {
        return;
    }
    if (typeof parsed !== 'object' || parsed === null)
        return;
    const bag = parsed;
    const media = bag.media;
    if (!media || typeof media.data !== 'string' || isMediaPointer(media.data))
        return;
    if (!exceedsBudget(Buffer.byteLength(media.data, 'utf8')))
        return;
    const { data, ...withoutPayload } = media;
    bag.media = {
        ...withoutPayload,
        omitted: true,
        sizeBytes: media.sizeBytes ?? Buffer.byteLength(data, 'base64'),
    };
    row.metadata = JSON.stringify(bag);
}
function stripBatchInlineMedia(row, exceedsBudget) {
    const raw = row.messages;
    if (typeof raw !== 'string')
        return;
    let parsed;
    try {
        parsed = JSON.parse(raw);
    }
    catch {
        return;
    }
    if (!Array.isArray(parsed))
        return;
    let stripped = false;
    for (const entry of parsed) {
        const content = entry?.content;
        if (typeof content !== 'object' || content === null)
            continue;
        const rawVariables = entry.variables;
        const variables = rawVariables && typeof rawVariables === 'object' && !Array.isArray(rawVariables)
            ? rawVariables
            : {};
        const kept = new Set();
        const refused = new Set();
        for (const key of ['image', 'video', 'audio', 'document']) {
            const media = content[key];
            if (!media || typeof media !== 'object' || typeof media.base64 !== 'string')
                continue;
            const template = media.base64;
            const used = new Set((0, template_render_1.templateVariableNames)(template));
            const named = Object.keys(variables).filter(name => used.has(name) && variables[name] != null);
            const scaffolding = (0, template_render_1.renderTemplate)(template, Object.fromEntries(named.map(name => [name, ''])));
            const encodedBytes = named.reduce((bytes, name) => {
                if (kept.has(name))
                    return bytes;
                const value = variables[name];
                return bytes + Buffer.byteLength(typeof value === 'string' ? value : JSON.stringify(value), 'utf8');
            }, Buffer.byteLength(scaffolding, 'utf8'));
            if (!exceedsBudget(encodedBytes)) {
                for (const name of named)
                    kept.add(name);
                continue;
            }
            for (const name of named)
                refused.add(name);
            delete media.base64;
            stripped = true;
        }
        for (const name of refused) {
            if (!kept.has(name))
                delete variables[name];
        }
    }
    if (stripped)
        row.messages = JSON.stringify(parsed);
}
function defineExportTable(table) {
    return table;
}
exports.EXPORT_TABLES = [
    defineExportTable({ key: 'sessions', table: 'sessions', afterRead: redactSessionProxyCredentials }),
    defineExportTable({ key: 'webhooks', table: 'webhooks', sessionFk: true, afterRead: redactWebhookCredentials }),
    defineExportTable({
        key: 'messages',
        table: 'messages',
        optional: true,
        afterRead: stripBodyTs,
        inlineMedia: {
            bucket: 'messages',
            recencyColumn: 'timestamp',
            payloadColumn: 'metadata',
            newestFirst: (row) => Number(row.timestamp),
            strip: stripInlineMediaPayload,
        },
    }),
    defineExportTable({
        key: 'messageBatches',
        table: 'message_batches',
        optional: true,
        inlineMedia: {
            bucket: 'messageBatches',
            recencyColumn: 'created_at',
            payloadColumn: 'messages',
            newestFirst: (row) => Date.parse(row.created_at),
            strip: stripBatchInlineMedia,
        },
    }),
    defineExportTable({ key: 'templates', table: 'templates', optional: true, sessionFk: true }),
    defineExportTable({
        key: 'baileysStoredMessages',
        table: 'baileys_stored_messages',
        optional: true,
        sessionFk: true,
    }),
    defineExportTable({ key: 'lidMappings', table: 'lid_mappings', optional: true }),
    defineExportTable({ key: 'chatStates', table: 'chat_states', optional: true }),
    defineExportTable({ key: 'pluginInstances', table: 'plugin_instances', optional: true }),
    defineExportTable({ key: 'conversationMappings', table: 'conversation_mappings', optional: true }),
    defineExportTable({ key: 'ingressEvents', table: 'ingress_events', optional: true }),
    defineExportTable({
        key: 'webhookDeliveryFailures',
        table: 'webhook_delivery_failures',
        optional: true,
        columns: [
            'id',
            'webhookId',
            'sessionId',
            'event',
            'url',
            'idempotencyKey',
            'deliveryId',
            'attempts',
            'lastStatusCode',
            'lastError',
            'createdAt',
        ],
        afterRead: stripWebhookFailurePayload,
    }),
    defineExportTable({ key: 'webhookOutboxEvents', table: 'webhook_outbox_events', optional: true }),
    defineExportTable({
        key: 'integrationDeliveryFailures',
        table: 'integration_delivery_failures',
        optional: true,
    }),
    defineExportTable({ key: 'statusUpdates', table: 'status_updates', optional: true }),
    defineExportTable({ key: 'automationRules', table: 'automation_rules', optional: true, sessionFk: true }),
];
exports.EXPORT_TABLE_EXCLUSIONS = {
    send_idempotency_keys: 'short-lived Idempotency-Key claims (24 h TTL), meaningless after a restore',
};
//# sourceMappingURL=export-tables.js.map