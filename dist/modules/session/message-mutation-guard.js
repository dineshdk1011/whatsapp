"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.phoneKey = phoneKey;
exports.provablyDifferent = provablyDifferent;
exports.mutationTargetsForeignRow = mutationTargetsForeignRow;
exports.mutationTargetsForeignRowPersisted = mutationTargetsForeignRowPersisted;
exports.receiptTargetsForeignRow = receiptTargetsForeignRow;
exports.receiptTargetsForeignRowPersisted = receiptTargetsForeignRowPersisted;
const message_entity_1 = require("../message/entities/message.entity");
const wa_id_1 = require("../../engine/identity/wa-id");
function phoneKey(local) {
    return local
        .replace(/\D/g, '')
        .replace(/^55(\d{2})9(\d{8})$/, '55$1$2')
        .replace(/^521(\d{10})$/, '52$1')
        .replace(/^549(\d+)$/, '54$1');
}
function entityOf(jid) {
    const parsed = (0, wa_id_1.parseWaId)(jid);
    if (parsed.kind === 'user')
        return { kind: 'user', id: phoneKey(parsed.userPart) };
    if (parsed.kind !== 'unknown')
        return { kind: parsed.kind, id: parsed.userPart };
    return !jid.includes('@') && /^\+?\d[\d -]*$/.test(jid.trim()) ? { kind: 'user', id: phoneKey(jid) } : null;
}
const isPerson = (kind) => kind === 'user' || kind === 'lid';
function isOwnBroadcast(row) {
    const kind = entityOf(row.chatId)?.kind;
    return row.direction === message_entity_1.MessageDirection.OUTGOING && (kind === 'broadcast' || kind === 'status');
}
function receivedThroughList(row, chatId, resolveLid) {
    return (row.direction === message_entity_1.MessageDirection.INCOMING &&
        entityOf(row.chatId)?.kind === 'broadcast' &&
        !provablyDifferent(row.author, chatId, resolveLid));
}
function provablyDifferent(a, b, resolveLid) {
    if (!a || !b || a === b)
        return false;
    const left = entityOf(a);
    const right = entityOf(b);
    if (!left || !right)
        return false;
    if (left.kind === right.kind)
        return left.id !== right.id;
    if (!isPerson(left.kind) || !isPerson(right.kind))
        return true;
    const lid = left.kind === 'lid' ? a : b;
    const phone = left.kind === 'user' ? left.id : right.id;
    const mapped = resolveLid?.(lid);
    return !mapped || phoneKey(mapped) !== phone;
}
function mutationTargetsForeignRow(row, source, resolveLid) {
    const listed = (source.kind === 'reaction' && isOwnBroadcast(row)) || receivedThroughList(row, source.chatId, resolveLid);
    if (!listed && provablyDifferent(row.chatId, source.chatId, resolveLid))
        return 'chat';
    const group = source.chatId.endsWith('@g.us') || row.chatId.endsWith('@g.us');
    const authorOnly = source.kind === 'edit' || (source.kind === 'revoke' && !group);
    if (authorOnly && source.fromMe !== undefined) {
        const expected = source.fromMe ? message_entity_1.MessageDirection.OUTGOING : message_entity_1.MessageDirection.INCOMING;
        if (row.direction && row.direction !== expected)
            return 'direction';
    }
    if (source.kind === 'edit' &&
        group &&
        source.fromMe === false &&
        provablyDifferent(row.author, source.author, resolveLid)) {
        return 'author';
    }
    return null;
}
async function mutationTargetsForeignRowPersisted(row, source, resolveLid) {
    if (!resolveLid)
        return mutationTargetsForeignRow(row, source);
    const phones = new Map();
    await Promise.all([...new Set([row.chatId, row.author, source.chatId, source.author])].map(async (jid) => {
        if (jid && (0, wa_id_1.parseWaId)(jid).kind === 'lid')
            phones.set(jid, await resolveLid(jid).catch(() => null));
    }));
    return mutationTargetsForeignRow(row, source, jid => phones.get(jid) ?? null);
}
function receiptTargetsForeignRow(row, chatId, resolveLid) {
    if (isOwnBroadcast(row) || receivedThroughList(row, chatId, resolveLid))
        return false;
    const stored = entityOf(row.chatId);
    const named = entityOf(chatId);
    if (stored && named && stored.kind !== named.kind && isPerson(stored.kind) && isPerson(named.kind)) {
        if (!resolveLid?.(stored.kind === 'lid' ? row.chatId : chatId))
            return false;
    }
    return provablyDifferent(row.chatId, chatId, resolveLid);
}
async function receiptTargetsForeignRowPersisted(row, chatId, resolveLid) {
    if (!resolveLid)
        return receiptTargetsForeignRow(row, chatId);
    const phones = new Map();
    await Promise.all([...new Set([row.chatId, row.author, chatId])].map(async (jid) => {
        if (jid && (0, wa_id_1.parseWaId)(jid).kind === 'lid')
            phones.set(jid, await resolveLid(jid).catch(() => null));
    }));
    return receiptTargetsForeignRow(row, chatId, jid => phones.get(jid) ?? null);
}
//# sourceMappingURL=message-mutation-guard.js.map