"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeScopeList = normalizeScopeList;
exports.apiKeyExpiryTime = apiKeyExpiryTime;
exports.apiKeyAuthorizationFingerprint = apiKeyAuthorizationFingerprint;
const chat_scope_1 = require("../../common/security/chat-scope");
function normalizeScopeList(list) {
    if (list == null)
        return null;
    const cleaned = list.map(entry => entry.trim()).filter(entry => entry.length > 0);
    return cleaned.length > 0 ? cleaned : null;
}
function apiKeyExpiryTime(value) {
    if (!value)
        return null;
    const time = value instanceof Date ? value.getTime() : new Date(value).getTime();
    return Number.isFinite(time) ? time : 0;
}
function apiKeyAuthorizationFingerprint(key) {
    const scope = (list) => {
        const normalized = normalizeScopeList(list);
        return normalized ? [...normalized].sort() : null;
    };
    return JSON.stringify([
        key.role,
        scope(key.allowedIps),
        scope(key.allowedSessions),
        scope((0, chat_scope_1.normalizeChatAllowList)(key.allowedChats)),
        apiKeyExpiryTime(key.expiresAt),
    ]);
}
//# sourceMappingURL=api-key-authorization.js.map