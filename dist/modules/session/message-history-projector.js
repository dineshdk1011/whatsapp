"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.persistHistoryMessages = persistHistoryMessages;
const typeorm_1 = require("typeorm");
const message_entity_1 = require("../message/entities/message.entity");
const message_row_mapper_1 = require("./message-row.mapper");
const message_mutation_guard_1 = require("./message-mutation-guard");
const feature_flags_1 = require("../../config/feature-flags");
const message_retention_service_1 = require("../message/message-retention.service");
const session_write_scope_1 = require("../../common/utils/session-write-scope");
async function persistHistoryMessages(messageRepository, configService, id, messages, logger, isLive, notifyRevoked, resolveLid) {
    const cleared = [];
    const storeEphemeralMessages = (0, feature_flags_1.resolveFeatureFlags)(configService).storeEphemeralMessages;
    const retentionCutoffMs = (0, message_retention_service_1.resolveMessageRetentionCutoff)()?.getTime();
    const byId = new Map();
    for (const m of messages) {
        if (!m.id || m.isStatusBroadcast || !m.chatId || !m.from || !m.to) {
            continue;
        }
        if (!storeEphemeralMessages && (m.ephemeralDuration ?? 0) > 0) {
            continue;
        }
        if (byId.get(m.id)?.type !== 'revoked' || m.type === 'revoked')
            byId.set(m.id, m);
    }
    if (byId.size === 0) {
        return cleared;
    }
    const ids = [...byId.keys()];
    const CHUNK = 400;
    let inserted = 0;
    for (let i = 0; i < ids.length; i += CHUNK) {
        const chunkIds = ids.slice(i, i + CHUNK);
        const existing = await messageRepository.find({
            where: { sessionId: id, waMessageId: (0, typeorm_1.In)(chunkIds) },
            select: { waMessageId: true, type: true, chatId: true, direction: true, author: true },
        });
        if (!isLive())
            break;
        const seen = new Set(existing.map(r => r.waMessageId));
        const rows = chunkIds
            .filter(x => !seen.has(x) || byId.get(x)?.type === 'revoked')
            .filter(x => {
            const m = byId.get(x);
            return (m.type === 'revoked' ||
                retentionCutoffMs === undefined ||
                !m.timestamp ||
                m.timestamp * 1000 >= retentionCutoffMs);
        })
            .map(x => {
            const m = byId.get(x);
            const metadata = (0, message_row_mapper_1.buildMessageMetadata)(m, true);
            const row = messageRepository.create({
                sessionId: id,
                waMessageId: m.id,
                chatId: m.chatId,
                author: m.fromMe ? undefined : m.author,
                from: m.from,
                to: m.to,
                body: m.body,
                type: m.type,
                direction: m.fromMe ? message_entity_1.MessageDirection.OUTGOING : message_entity_1.MessageDirection.INCOMING,
                timestamp: m.timestamp,
                status: message_entity_1.MessageStatus.SENT,
                metadata,
            });
            if (m.type === 'revoked')
                Object.assign(row, message_row_mapper_1.REVOKED_ROW_PATCH);
            if (m.timestamp) {
                row.createdAt = new Date(m.timestamp * 1000);
            }
            return row;
        });
        if (rows.length) {
            const writes = (0, session_write_scope_1.captureSessionWrites)(messageRepository.manager?.connection ?? messageRepository, id);
            await writes
                .write(() => messageRepository
                .createQueryBuilder()
                .insert()
                .values(rows)
                .orIgnore()
                .execute())
                .finally(() => writes.close());
            inserted += rows.length;
        }
        const storedChats = new Map(existing.map(r => [r.waMessageId, r]));
        for (const messageId of chunkIds) {
            const m = byId.get(messageId);
            if (m.type !== 'revoked')
                continue;
            const stored = storedChats.get(messageId);
            const storedChat = stored?.chatId ?? m.chatId;
            if (stored &&
                (await (0, message_mutation_guard_1.mutationTargetsForeignRowPersisted)(stored, { kind: 'revoke', chatId: m.chatId, fromMe: m.fromMe }, resolveLid)))
                continue;
            if (!isLive())
                break;
            await messageRepository.update({
                sessionId: id,
                waMessageId: messageId,
                chatId: storedChat,
                direction: m.fromMe ? message_entity_1.MessageDirection.OUTGOING : message_entity_1.MessageDirection.INCOMING,
            }, message_row_mapper_1.REVOKED_ROW_PATCH);
        }
        if (rows.length || existing.some(row => row.type === 'revoked')) {
            const revoked = await messageRepository.find({
                where: { sessionId: id, waMessageId: (0, typeorm_1.In)(chunkIds), type: 'revoked' },
            });
            for (const row of revoked) {
                const m = byId.get(row.waMessageId);
                if (!isLive())
                    break;
                const direction = m.fromMe ? message_entity_1.MessageDirection.OUTGOING : message_entity_1.MessageDirection.INCOMING;
                if ((await (0, message_mutation_guard_1.mutationTargetsForeignRowPersisted)(row, { kind: 'revoke', chatId: m.chatId, fromMe: m.fromMe }, resolveLid)) ||
                    row.direction !== direction ||
                    !Number.isFinite(m.timestamp)) {
                    continue;
                }
                if (!isLive())
                    break;
                if (row.timestamp == null || row.timestamp > m.timestamp) {
                    const result = await messageRepository.update({
                        sessionId: id,
                        waMessageId: m.id,
                        chatId: row.chatId,
                        direction,
                        type: 'revoked',
                        timestamp: (0, typeorm_1.Raw)(alias => `(${alias} IS NULL OR ${alias} > :historyTimestamp)`, {
                            historyTimestamp: m.timestamp,
                        }),
                    }, { timestamp: m.timestamp, createdAt: new Date(m.timestamp * 1000) });
                    if (result.affected) {
                        row.timestamp = m.timestamp;
                        row.createdAt = new Date(m.timestamp * 1000);
                    }
                }
                if (!isLive())
                    break;
                cleared.push({
                    id: m.id,
                    chatId: m.chatId,
                    from: m.from,
                    to: m.to,
                    fromMe: m.fromMe,
                    isGroup: m.isGroup,
                    kind: m.kind,
                    author: m.author,
                    type: 'revoked',
                    body: '',
                    timestamp: Math.min(row.timestamp ?? m.timestamp, m.timestamp),
                });
                if (m.type === 'revoked')
                    notifyRevoked?.(row);
            }
        }
    }
    if (inserted) {
        logger.log(`Persisted ${inserted} history message(s)`, {
            sessionId: id,
            inserted,
            action: 'history_messages_persisted',
        });
    }
    return cleared;
}
//# sourceMappingURL=message-history-projector.js.map