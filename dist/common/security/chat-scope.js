"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isChatScopeRestricted = isChatScopeRestricted;
exports.normalizeChatAllowList = normalizeChatAllowList;
exports.buildChatScope = buildChatScope;
exports.chatScopeAllows = chatScopeAllows;
exports.chatIdAllowed = chatIdAllowed;
exports.buildExpandedChatScope = buildExpandedChatScope;
exports.filterByChatScope = filterByChatScope;
const wa_id_1 = require("../../engine/identity/wa-id");
const jid_candidates_1 = require("../../engine/identity/jid-candidates");
const BARE_NUMBER = /^\d{5,}$/;
function isChatScopeRestricted(allowedChats) {
    return (allowedChats?.length ?? 0) > 0;
}
function normalizeChatAllowList(list) {
    if (list == null)
        return null;
    const cleaned = list.map(entry => entry.trim()).filter(entry => entry.length > 0);
    const qualified = [...new Set(cleaned.map(entry => (BARE_NUMBER.test(entry) ? `${entry}@c.us` : entry)))];
    return qualified.length > 0 ? qualified : null;
}
function addressForms(chatId) {
    const parsed = (0, wa_id_1.parseWaId)(chatId);
    switch (parsed.kind) {
        case 'user':
            return [`${parsed.userPart}@c.us`, `${parsed.userPart}@s.whatsapp.net`];
        case 'lid':
            return [`${parsed.userPart}@lid`];
        case 'group':
            return [`${parsed.userPart}@g.us`];
        default:
            return [];
    }
}
function buildChatScope(allowedChats) {
    if (!isChatScopeRestricted(allowedChats))
        return null;
    const allowed = new Set();
    for (const entry of normalizeChatAllowList(allowedChats) ?? []) {
        for (const form of addressForms(entry))
            allowed.add(form);
    }
    return { allowed };
}
function chatScopeAllows(scope, chatId) {
    if (scope === null)
        return true;
    return addressForms(chatId).some(form => scope.allowed.has(form));
}
async function chatIdAllowed(scope, chatId, directory) {
    if (scope === null)
        return true;
    const candidates = await (0, jid_candidates_1.resolveJidCandidates)(chatId, directory);
    return candidates.some(candidate => scope.allowed.has(candidate));
}
async function buildExpandedChatScope(allowedChats, directory) {
    const scope = buildChatScope(allowedChats);
    if (scope === null || !directory)
        return scope;
    const phones = new Set();
    const lids = new Set();
    for (const entry of normalizeChatAllowList(allowedChats) ?? []) {
        const parsed = (0, wa_id_1.parseWaId)(entry);
        if (parsed.kind === 'user')
            phones.add(parsed.userPart);
        else if (parsed.kind === 'lid')
            lids.add(parsed.userPart);
    }
    const [lidToPhone, phoneToLids] = await Promise.all([
        directory.phonesForLids([...lids]),
        directory.lidsForPhones([...phones]),
    ]);
    const allowed = new Set(scope.allowed);
    for (const phone of Object.values(lidToPhone)) {
        if (phone) {
            allowed.add(`${phone}@c.us`);
            allowed.add(`${phone}@s.whatsapp.net`);
        }
    }
    for (const mapped of Object.values(phoneToLids)) {
        for (const lid of mapped)
            allowed.add(`${lid}@lid`);
    }
    return { allowed };
}
function filterByChatScope(scope, items, chatIdOf) {
    if (scope === null)
        return [...items];
    return items.filter(item => {
        const id = chatIdOf(item);
        return id != null && chatScopeAllows(scope, id);
    });
}
//# sourceMappingURL=chat-scope.js.map