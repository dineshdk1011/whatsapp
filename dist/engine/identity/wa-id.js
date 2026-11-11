"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userPart = userPart;
exports.parseWaId = parseWaId;
exports.isIndividualWid = isIndividualWid;
exports.isAddressableParticipant = isAddressableParticipant;
exports.toParticipantWid = toParticipantWid;
exports.toNeutralJid = toNeutralJid;
exports.isChannelJid = isChannelJid;
exports.chatKind = chatKind;
const DOMAIN_KINDS = new Map([
    ['c.us', 'user'],
    ['s.whatsapp.net', 'user'],
    ['lid', 'lid'],
    ['hosted', 'user'],
    ['hosted.lid', 'lid'],
    ['g.us', 'group'],
    ['newsletter', 'newsletter'],
    ['broadcast', 'broadcast'],
]);
function userPart(jid) {
    return jid.split('@')[0].split(':')[0];
}
function parseWaId(jid) {
    const raw = jid;
    const lower = jid.trim().toLowerCase();
    if (lower === 'status@broadcast') {
        return { kind: 'status', userPart: 'status', raw };
    }
    const at = lower.lastIndexOf('@');
    if (at === -1) {
        return { kind: 'unknown', userPart: lower, raw };
    }
    const domain = lower.slice(at + 1);
    const [local, device] = lower.slice(0, at).split(':');
    const kind = DOMAIN_KINDS.get(domain) ?? 'unknown';
    return { kind, userPart: local, device, raw };
}
const NUMERIC_ID = /^\d{5,}$/;
function isIndividualWid(value) {
    const { kind, userPart } = parseWaId(value.trim());
    return (kind === 'user' || kind === 'lid') && NUMERIC_ID.test(userPart);
}
function isAddressableParticipant(value) {
    const trimmed = value.trim();
    return isIndividualWid(trimmed) || NUMERIC_ID.test(trimmed);
}
function toParticipantWid(value) {
    const trimmed = value.trim();
    if (NUMERIC_ID.test(trimmed))
        return `${trimmed}@c.us`;
    return isIndividualWid(trimmed) ? toNeutralJid(trimmed) : trimmed;
}
function toNeutralJid(jid, resolvePhone) {
    if (!jid) {
        return jid;
    }
    const parsed = parseWaId(jid);
    switch (parsed.kind) {
        case 'user':
            return `${parsed.userPart}@c.us`;
        case 'group':
            return `${parsed.userPart}@g.us`;
        case 'lid': {
            const phone = resolvePhone?.(jid);
            return phone ? `${phone}@c.us` : `${parsed.userPart}@lid`;
        }
        case 'status':
            return 'status@broadcast';
        case 'newsletter':
            return `${parsed.userPart}@newsletter`;
        case 'broadcast':
            return `${parsed.userPart}@broadcast`;
        default:
            return jid;
    }
}
function isChannelJid(jid) {
    return parseWaId(jid).kind === 'newsletter';
}
function chatKind(jid) {
    switch (parseWaId(jid).kind) {
        case 'user':
        case 'lid':
            return 'individual';
        case 'group':
            return 'group';
        case 'newsletter':
            return 'channel';
        case 'status':
            return 'status';
        case 'broadcast':
            return 'broadcast';
        default:
            return 'unknown';
    }
}
//# sourceMappingURL=wa-id.js.map