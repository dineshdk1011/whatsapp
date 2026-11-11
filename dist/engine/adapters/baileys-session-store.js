"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaileysSessionStore = exports.SESSION_STORE_MAP_CAP_DEFAULT = void 0;
const wa_id_1 = require("../identity/wa-id");
const baileys_chat_state_store_service_1 = require("./baileys-chat-state-store.service");
const configuration_1 = require("../../config/configuration");
const baileys_message_mapper_1 = require("./baileys-message-mapper");
exports.SESSION_STORE_MAP_CAP_DEFAULT = 5000;
class LruMap {
    max;
    pinned;
    map = new Map();
    unpinned = 0;
    constructor(max, pinned) {
        this.max = max;
        this.pinned = pinned;
    }
    isPinned(value) {
        return this.pinned ? this.pinned(value) : false;
    }
    drop(key) {
        if (!this.map.has(key)) {
            return;
        }
        if (!this.isPinned(this.map.get(key))) {
            this.unpinned--;
        }
        this.map.delete(key);
    }
    has(key) {
        return this.map.has(key);
    }
    delete(key) {
        this.drop(key);
    }
    get(key) {
        if (!this.map.has(key)) {
            return undefined;
        }
        const value = this.map.get(key);
        this.map.delete(key);
        this.map.set(key, value);
        return value;
    }
    set(key, value) {
        this.drop(key);
        this.map.set(key, value);
        if (!this.isPinned(value)) {
            this.unpinned++;
        }
        if (!this.max) {
            return;
        }
        while (this.unpinned > this.max) {
            const victim = this.oldestEvictable();
            if (victim === undefined) {
                break;
            }
            this.drop(victim);
        }
    }
    oldestEvictable() {
        if (!this.pinned) {
            const oldest = this.map.keys().next().value;
            return oldest;
        }
        for (const [key, value] of this.map) {
            if (!this.pinned(value)) {
                return key;
            }
        }
        return undefined;
    }
    values() {
        return this.map.values();
    }
    entries() {
        return this.map.entries();
    }
}
function isPhoneKeyed(rawId) {
    return rawId.endsWith('@s.whatsapp.net') || rawId.endsWith('@c.us');
}
function mergeContactTwins(a, b) {
    const aWins = isPhoneKeyed(a.rawId) !== isPhoneKeyed(b.rawId) ? isPhoneKeyed(a.rawId) : a.rawId <= b.rawId;
    const [primary, secondary] = aWins ? [a, b] : [b, a];
    return {
        rawId: primary.rawId,
        contact: {
            id: primary.contact.id,
            name: primary.contact.name ?? secondary.contact.name,
            pushName: primary.contact.pushName ?? secondary.contact.pushName,
            number: primary.contact.number || secondary.contact.number,
            isMyContact: primary.contact.isMyContact || secondary.contact.isMyContact,
            isBlocked: primary.contact.isBlocked || secondary.contact.isBlocked,
            profilePicUrl: primary.contact.profilePicUrl ?? secondary.contact.profilePicUrl,
        },
    };
}
class BaileysSessionStore {
    lidStore;
    sessionId;
    chatStateStore;
    contacts;
    chats;
    lastMessages;
    lastInbound;
    messageOrder = 0;
    lidToPn;
    ephemeralByChat;
    timerSetAt;
    deletionMarks;
    heldChatUpdates;
    constructor(lidStore, sessionId, chatStateStore) {
        this.lidStore = lidStore;
        this.sessionId = sessionId;
        this.chatStateStore = chatStateStore;
        const maxEntries = (0, configuration_1.resolveNonNegativeIntEnv)(process.env.BAILEYS_SESSION_STORE_MAX_ENTRIES, exports.SESSION_STORE_MAP_CAP_DEFAULT);
        this.contacts = new LruMap(maxEntries, contact => Boolean(contact.name));
        this.chats = new LruMap(maxEntries);
        this.lastMessages = new LruMap(maxEntries);
        this.lastInbound = new LruMap(maxEntries);
        this.lidToPn = new LruMap(maxEntries);
        this.ephemeralByChat = new LruMap(maxEntries * 2);
        this.timerSetAt = new LruMap(maxEntries * 2);
        this.deletionMarks = new LruMap(maxEntries);
        this.heldChatUpdates = new LruMap(maxEntries);
    }
    upsertContacts(records = []) {
        for (const r of records) {
            const id = r.id ?? r.lid;
            if (!id) {
                continue;
            }
            const kind = (0, wa_id_1.parseWaId)(id).kind;
            if (kind === 'group' || kind === 'newsletter' || kind === 'broadcast' || kind === 'status') {
                continue;
            }
            const existing = this.contacts.get(id) ?? { id };
            const merged = { id: existing.id };
            this.assignDefined(merged, existing);
            this.assignDefined(merged, { ...r, id });
            this.contacts.set(id, merged);
            const phone = merged.phoneNumber ?? (merged.id.endsWith('@s.whatsapp.net') ? merged.id : undefined);
            const lid = merged.lid ?? ((0, wa_id_1.parseWaId)(merged.id).kind === 'lid' ? merged.id : undefined);
            if (lid && phone && (r.lid !== undefined || r.phoneNumber !== undefined)) {
                this.lidToPn.set(lid, phone);
                this.persistLidMapping(lid, phone, r.phoneNumber !== undefined || kind === 'user');
            }
        }
    }
    assignDefined(target, source) {
        for (const key of Object.keys(source)) {
            const value = source[key];
            if (value !== undefined) {
                target[key] = value;
            }
        }
    }
    upsertChats(records = []) {
        const lidIndex = records.some(c => Object.hasOwn(c, 'ephemeralExpiration')) ? this.lidKeysByPhone() : undefined;
        for (const record of records) {
            const r = this.withoutStaleTimer(record, lidIndex);
            if (!r.id) {
                continue;
            }
            const timestamp = this.toUnixSeconds(r.conversationTimestamp);
            if (this.stillDeleted(r.id, timestamp)) {
                this.applyChatTimer(r.id, r, lidIndex);
                const messageId = r.messages?.[0]?.message?.key?.id;
                const mark = messageId ? this.deletionMark(this.markKeys(r.id)) : undefined;
                if (messageId && mark && timestamp === Math.floor(mark.at / 1000)) {
                    this.heldChatUpdates.set(messageId, { mark, chatId: r.id, update: r });
                }
                continue;
            }
            const existing = this.chats.get(r.id) ?? { id: r.id };
            this.chats.set(r.id, { ...existing, ...r });
            this.persistChatState(r.id, r);
            this.applyChatTimer(r.id, r, lidIndex);
        }
    }
    applyChatTimer(chatId, r, lidIndex) {
        if (!Object.hasOwn(r, 'ephemeralExpiration'))
            return;
        const exp = r.ephemeralExpiration;
        const setAt = this.toUnixSeconds(r.ephemeralSettingTimestamp);
        for (const key of this.timerKeys(chatId, lidIndex)) {
            if (typeof exp === 'number' && exp > 0) {
                this.ephemeralByChat.set(key, exp);
            }
            else {
                this.ephemeralByChat.delete(key);
            }
            if (setAt)
                this.timerSetAt.set(key, setAt);
            const twin = key === chatId ? undefined : this.chats.get(key);
            if (twin)
                this.chats.set(key, { ...twin, ephemeralExpiration: exp });
        }
    }
    timerKeys(chatId, lidIndex) {
        const twins = this.chatTwins(chatId, lidIndex);
        const own = (0, wa_id_1.parseWaId)(chatId);
        const keys = this.phoneOfManyLids(twins, lidIndex)
            ? twins.filter(k => {
                const id = (0, wa_id_1.parseWaId)(k);
                return id.kind === own.kind && id.userPart === own.userPart;
            })
            : twins;
        return new Set(keys.flatMap(k => [k, this.toNeutralJid(k)]));
    }
    phoneOfManyLids(twins, lidIndex) {
        const phone = twins.find(k => (0, wa_id_1.parseWaId)(k).kind === 'user');
        if (!phone)
            return false;
        const lids = new Set(this.chatTwins(phone, lidIndex)
            .map(k => (0, wa_id_1.parseWaId)(k))
            .flatMap(id => (id.kind === 'lid' ? [id.userPart] : [])));
        return lids.size > 1;
    }
    withoutStaleTimer(r, lidIndex) {
        const setAt = this.toUnixSeconds(r.ephemeralSettingTimestamp);
        if (!r.id || !setAt || !Object.hasOwn(r, 'ephemeralExpiration'))
            return r;
        if (![...this.timerKeys(r.id, lidIndex)].some(k => (this.timerSetAt.get(k) ?? 0) > setAt))
            return r;
        const kept = { ...r };
        delete kept.ephemeralExpiration;
        delete kept.ephemeralSettingTimestamp;
        return kept;
    }
    removeChats(ids = []) {
        const keys = new Set(ids.flatMap(id => this.chatTwins(id)));
        for (const key of keys) {
            this.chats.delete(key);
            this.lastMessages.delete(key);
            this.lastInbound.delete(key);
        }
        if (keys.size && this.chatStateStore && this.sessionId) {
            const twinsOf = new Map();
            for (const id of ids) {
                const key = this.stateKey(id);
                twinsOf.set(key, new Set([...(twinsOf.get(key) ?? []), ...this.chatTwins(id)]));
            }
            const at = Date.now();
            const marks = new Map();
            for (const [key, twins] of twinsOf) {
                const spellings = new Set([key, ...twins, ...[...twins].map(twin => this.stateKey(twin))]);
                const met = new Set([...spellings].flatMap(k => marks.get(k) ?? []));
                const stateKeys = [key, ...[...met].flatMap(m => m.stateKeys)];
                const mark = { at, order: this.messageOrder, stateKeys, cleared: false };
                for (const [k, m] of marks)
                    if (met.has(m))
                        spellings.add(k);
                for (const k of spellings)
                    marks.set(k, mark);
            }
            for (const [k, mark] of marks)
                this.deletionMarks.set(k, mark);
            void this.markDeleted(this.chatStateStore, this.sessionId, ids, keys, twinsOf, at);
        }
    }
    async markDeleted(store, sessionId, ids, keys, twinsOf, deletedAt) {
        const reset = { muteEndTime: null, archived: false, pinned: false, deletedAt };
        const marked = Promise.all([...twinsOf].map(([key, twins]) => store.fold(sessionId, key, [...twins].filter(k => !twinsOf.has(k)), reset)));
        const extra = new Set();
        for (const id of ids) {
            const parsed = (0, wa_id_1.parseWaId)(id);
            try {
                if (parsed.kind === 'lid') {
                    const phone = await this.lidStore?.findPhoneForLid?.(id);
                    if (phone)
                        extra.add(`${(0, wa_id_1.userPart)(phone)}@s.whatsapp.net`);
                }
                else if (parsed.kind === 'user') {
                    for (const lid of (await this.lidStore?.findLidsForPhone?.(parsed.userPart)) ?? [])
                        extra.add(`${lid}@lid`);
                }
            }
            catch {
            }
        }
        await marked;
        const missed = [...extra].filter(k => !keys.has(k) && !twinsOf.has(k));
        if (missed.length)
            await store.forget(sessionId, missed);
    }
    chatDeletedAt(chatId) {
        const recordIds = this.chatTwins(chatId);
        return this.deletedAtOf(this.stateKeys(chatId, recordIds), this.chatState(chatId, recordIds)?.deletedAt);
    }
    deletedAtOf(keys, persisted) {
        const mark = this.deletionMark(keys);
        if (mark)
            return mark.cleared ? null : mark.at;
        return persisted ?? null;
    }
    deletionMark(keys) {
        for (const key of keys) {
            const mark = this.deletionMarks.get(key);
            if (mark)
                return mark;
        }
        return undefined;
    }
    stillDeleted(jid, timestamp, order) {
        const store = this.chatStateStore;
        const sid = this.sessionId;
        if (!store || !sid)
            return false;
        const lookup = this.markKeys(jid);
        const mark = this.deletionMark(lookup);
        if (mark) {
            if (mark.cleared)
                return false;
            const observedAfter = order !== undefined && order > mark.order && timestamp === Math.floor(mark.at / 1000);
            if (timestamp * 1000 <= mark.at && !observedAfter)
                return true;
            mark.cleared = true;
            void store.forget(sid, [...new Set([...mark.stateKeys, ...lookup])]);
            return false;
        }
        const rows = lookup.flatMap(k => {
            const value = store.get(sid, k);
            return value ? [{ k, value }] : [];
        });
        const deletedAt = (0, baileys_chat_state_store_service_1.mergeTwinStates)(rows.map(r => r.value))?.deletedAt;
        if (!deletedAt)
            return false;
        if (timestamp * 1000 <= deletedAt)
            return true;
        void store.forget(sid, rows.map(r => r.k));
        return false;
    }
    markKeys(jid) {
        const key = this.stateKey(jid);
        return [key, ...this.stateTwins([jid], key, new Map())];
    }
    addLidMappings(mappings = [], isReported = true) {
        for (const m of mappings) {
            if (m.lid && m.pn) {
                this.lidToPn.set(m.lid, m.pn);
                this.persistLidMapping(m.lid, m.pn, isReported);
            }
        }
    }
    recordKeyLidMappings(key) {
        const broadcast = key.remoteJid?.endsWith('@broadcast');
        this.addLidMappings([
            key.fromMe === true ? {} : this.lidPnPair(broadcast ? key.participant : key.remoteJid, key.remoteJidAlt),
            this.lidPnPair(key.participant, key.participantAlt),
        ]);
    }
    lidPnPair(jid, alt) {
        if (!jid || !alt) {
            return {};
        }
        const [lid, pn] = jid.endsWith('@lid') ? [jid, alt] : alt.endsWith('@lid') ? [alt, jid] : [];
        return lid && pn && (0, wa_id_1.parseWaId)(pn).kind === 'user' ? { lid, pn } : {};
    }
    persistLidMapping(lidJid, pnJid, isReported) {
        if (isReported)
            void this.lidStore?.remember((0, wa_id_1.userPart)(lidJid), (0, wa_id_1.userPart)(pnJid), this.sessionId);
        else
            void this.lidStore?.rememberIfUnknown?.((0, wa_id_1.userPart)(lidJid), (0, wa_id_1.userPart)(pnJid), this.sessionId);
    }
    nextMessageOrder() {
        return ++this.messageOrder;
    }
    recordMessage(msg, type, order = this.nextMessageOrder()) {
        const chatId = msg.key?.remoteJid;
        if (!chatId || !msg.key) {
            return;
        }
        this.recordEphemeralFromMessage(chatId, msg);
        const key = this.toEngineJid((0, baileys_message_mapper_1.baileysChatJid)(chatId, msg.key.participant, msg.key.fromMe === true));
        const timestamp = this.toUnixSeconds(msg.messageTimestamp);
        this.stillDeleted(key, timestamp, order);
        const messageId = msg.key.id ?? '';
        const held = this.heldChatUpdates.get(messageId);
        if (held) {
            this.heldChatUpdates.delete(messageId);
            const { mark, chatId, update } = held;
            if (mark.cleared && order > mark.order && this.deletionMark(this.markKeys(chatId)) === mark) {
                if (this.chatTwins(chatId).some(k => this.chats.has(k))) {
                    this.chats.set(chatId, { ...this.withoutStaleTimer(update), ...this.chats.get(chatId) });
                }
                else {
                    this.upsertChats([update]);
                }
            }
        }
        if (!msg.key.fromMe) {
            const inbound = this.lastInbound.get(key);
            if (!inbound ||
                inbound.timestamp < timestamp ||
                (inbound.timestamp === timestamp && this.followsOther(msg, order, inbound))) {
                this.lastInbound.set(key, { key: msg.key, timestamp, order });
            }
        }
        const existing = this.lastMessages.get(key);
        if (existing &&
            (existing.timestamp > timestamp || (existing.timestamp === timestamp && !this.followsOther(msg, order, existing)))) {
            return;
        }
        const text = type === 'revoked' ? '' : (0, baileys_message_mapper_1.baileysMessageText)(msg.message);
        this.lastMessages.set(key, { key: msg.key, timestamp, text, type, order });
    }
    followsOther(msg, order, other) {
        return !!msg.key.id && other.key.id !== msg.key.id && order > other.order;
    }
    recordMessageEdit(chatId, messageId, text, type, accept) {
        if (!messageId)
            return;
        for (const key of new Set([chatId, this.toEngineJid(chatId)])) {
            const existing = this.lastMessages.get(key);
            if (existing?.key.id === messageId && (!accept || accept(existing.key)))
                this.lastMessages.set(key, { ...existing, text, type: type ?? existing.type });
        }
    }
    chatKey(jid) {
        if (this.chats.has(jid))
            return jid;
        const twins = this.chatTwins(jid);
        return twins.find(k => this.chats.has(k)) ?? twins.find(k => this.lastMessages.has(k)) ?? this.toEngineJid(jid);
    }
    lidOf(jid) {
        for (const twin of this.chatTwins(jid)) {
            const parsed = (0, wa_id_1.parseWaId)(twin);
            if (parsed.kind === 'lid')
                return `${parsed.userPart}@lid`;
        }
        return null;
    }
    chatTwins(jid, lidIndex) {
        const parsed = (0, wa_id_1.parseWaId)(jid);
        const twins = [jid, this.toEngineJid(jid)];
        if (parsed.kind === 'lid') {
            twins.push(`${parsed.userPart}@lid`);
            const phone = this.resolvePhone(jid);
            if (phone)
                twins.push(`${phone}@s.whatsapp.net`);
        }
        else if (parsed.kind === 'user') {
            if (lidIndex) {
                twins.push(...(lidIndex.get(parsed.userPart) ?? []));
            }
            else {
                for (const [lid, pn] of this.lidToPn.entries()) {
                    if ((0, wa_id_1.userPart)(pn) === parsed.userPart)
                        twins.push(lid);
                }
            }
            for (const lid of this.lidStore?.lidsForPhone(parsed.userPart) ?? [])
                twins.push(`${lid}@lid`);
        }
        return twins;
    }
    recordEphemeralFromMessage(chatId, msg) {
        const duration = this.extractEphemeralDuration(msg);
        if (duration === undefined) {
            return;
        }
        const setAt = Math.max(...[this.chatKey(chatId), ...this.chatTwins(chatId)].flatMap(k => [
            this.toUnixSeconds(this.chats.get(k)?.ephemeralSettingTimestamp),
            this.timerSetAt.get(k) ?? 0,
            this.timerSetAt.get(this.toNeutralJid(k)) ?? 0,
        ]));
        if (setAt > 0 && this.toUnixSeconds(msg.messageTimestamp) <= setAt) {
            return;
        }
        this.ephemeralByChat.set(chatId, duration);
        this.ephemeralByChat.set(this.toNeutralJid(chatId), duration);
    }
    extractEphemeralDuration(msg) {
        const fromInfo = msg.ephemeralDuration;
        if (typeof fromInfo === 'number' && fromInfo > 0) {
            return fromInfo;
        }
        const fromContext = this.contextExpiration(msg.message);
        return typeof fromContext === 'number' && fromContext > 0 ? fromContext : undefined;
    }
    contextExpiration(content, depth = 0) {
        if (!content || typeof content !== 'object' || depth > 4) {
            return undefined;
        }
        const nodes = content;
        for (const node of Object.values(nodes)) {
            const exp = node?.contextInfo?.expiration;
            if (typeof exp === 'number' && exp > 0) {
                return exp;
            }
            if (node?.message) {
                const nested = this.contextExpiration(node.message, depth + 1);
                if (nested !== undefined) {
                    return nested;
                }
            }
        }
        return undefined;
    }
    listContacts() {
        const byId = new Map();
        for (const c of [...this.contacts.values()]) {
            if (!c.name)
                continue;
            const twin = { contact: this.toNeutralContact(c), rawId: c.id };
            const existing = byId.get(twin.contact.id);
            byId.set(twin.contact.id, existing ? mergeContactTwins(existing, twin) : twin);
        }
        return [...byId.values()].map(t => t.contact);
    }
    findContact(id) {
        const parsed = (0, wa_id_1.parseWaId)(id);
        const keys = [id, this.toEngineJid(id)];
        if (parsed.kind === 'lid') {
            keys.push(`${parsed.userPart}@lid`);
        }
        if (parsed.kind === 'user') {
            keys.push(`${parsed.userPart}@s.whatsapp.net`, `${parsed.userPart}@c.us`);
        }
        let unnamed;
        for (const key of keys) {
            const direct = this.contacts.get(key);
            if (!direct)
                continue;
            if (direct.name)
                return this.toNeutralContact(direct);
            unnamed ??= direct;
        }
        if (parsed.kind !== 'user' && parsed.kind !== 'lid') {
            return unnamed ? this.toNeutralContact(unnamed) : null;
        }
        const want = parsed.userPart;
        for (const c of this.contacts.values()) {
            const phone = c.phoneNumber
                ? (0, wa_id_1.userPart)(c.phoneNumber)
                : c.id.endsWith('@s.whatsapp.net') || c.id.endsWith('@c.us')
                    ? (0, wa_id_1.userPart)(c.id)
                    : '';
            const lid = c.lid ? (0, wa_id_1.userPart)(c.lid) : c.id.endsWith('@lid') ? (0, wa_id_1.userPart)(c.id) : '';
            if ((parsed.kind === 'user' ? phone : lid) !== want)
                continue;
            if (c.name)
                return this.toNeutralContact(c);
            unnamed ??= c;
        }
        return unnamed ? this.toNeutralContact(unnamed) : null;
    }
    listChats() {
        const lidIndex = this.lidsByPhone();
        const previews = new Map();
        for (const [key, m] of [...this.lastMessages.entries()]) {
            const id = this.toNeutralJid(key);
            const seen = previews.get(id);
            if (!seen || m.timestamp > seen.timestamp || (m.timestamp === seen.timestamp && m.order > seen.order)) {
                previews.set(id, m);
            }
        }
        const byId = new Map();
        for (const c of [...this.chats.values()]) {
            const id = this.toNeutralJid(c.id);
            byId.set(id, [...(byId.get(id) ?? []), c]);
        }
        for (const [key] of [...this.lastMessages.entries()]) {
            const id = this.toNeutralJid(key);
            if (!byId.has(id))
                byId.set(id, [{ id: key }]);
        }
        if (this.chatStateStore && this.sessionId) {
            for (const chatId of this.chatStateStore.chatIds(this.sessionId)) {
                const id = this.toNeutralJid(chatId);
                if (!byId.has(id))
                    byId.set(id, [{ id: chatId }]);
            }
        }
        return [...byId].flatMap(([id, records]) => this.toNeutralChat(id, records, previews.get(id), lidIndex) ?? []);
    }
    chatJid(chatId) {
        return this.chatKey(chatId);
    }
    lastMessage(chatId) {
        const m = this.newestAcrossTwins(this.lastMessages, chatId);
        return m ? { key: m.key, timestamp: m.timestamp, jid: this.chatJid(chatId) } : null;
    }
    lastInboundMessage(chatId) {
        const m = this.newestAcrossTwins(this.lastInbound, chatId);
        return m ? { key: m.key, timestamp: m.timestamp } : null;
    }
    newestAcrossTwins(map, chatId) {
        let newest;
        for (const k of [this.chatKey(chatId), ...this.chatTwins(chatId)]) {
            const v = map.get(k);
            if (v &&
                (!newest || v.timestamp > newest.timestamp || (v.timestamp === newest.timestamp && v.order > newest.order))) {
                newest = v;
            }
        }
        return newest;
    }
    getEphemeralExpiration(chatId) {
        const shared = this.phoneOfManyLids(this.chatTwins(chatId));
        if (shared && (0, wa_id_1.parseWaId)(chatId).kind === 'user')
            return undefined;
        const fromMessage = [chatId, this.toEngineJid(chatId), ...this.timerKeys(chatId)]
            .map(key => this.ephemeralByChat.get(key))
            .find(value => typeof value === 'number' && value > 0);
        if (typeof fromMessage === 'number' && fromMessage > 0) {
            return fromMessage;
        }
        const chat = this.chats.get(chatId) ??
            this.chats.get(this.toEngineJid(chatId)) ??
            this.chats.get(this.toNeutralJid(chatId)) ??
            (shared ? undefined : this.chats.get(this.chatKey(chatId)));
        const exp = chat?.ephemeralExpiration;
        return typeof exp === 'number' && exp > 0 ? exp : undefined;
    }
    resolvePhone(id) {
        const parsed = (0, wa_id_1.parseWaId)(id);
        if (parsed.kind === 'user') {
            return parsed.userPart;
        }
        if (parsed.kind === 'lid') {
            const lidJid = `${parsed.userPart}@lid`;
            const pn = this.lidToPn.get(lidJid) ?? this.lidToPn.get(id);
            if (pn) {
                return (0, wa_id_1.userPart)(pn);
            }
            const contactPhone = (this.contacts.get(lidJid) ?? this.contacts.get(id))?.phoneNumber;
            if (contactPhone) {
                return (0, wa_id_1.userPart)(contactPhone);
            }
            return this.lidStore?.getCached(parsed.userPart) ?? null;
        }
        return null;
    }
    toNeutralJid(jid) {
        return (0, wa_id_1.toNeutralJid)(jid);
    }
    toEngineJid(jid) {
        const parsed = (0, wa_id_1.parseWaId)(jid);
        return parsed.kind === 'user' ? `${parsed.userPart}@s.whatsapp.net` : jid;
    }
    toNeutralContact(c) {
        const id = this.toNeutralJid(c.id);
        const number = c.phoneNumber ? (0, wa_id_1.userPart)(c.phoneNumber) : (this.resolvePhone(c.id) ?? '');
        return {
            id,
            name: c.name ?? c.verifiedName,
            pushName: c.notify,
            number,
            isMyContact: Boolean(c.name),
            isBlocked: false,
            profilePicUrl: c.imgUrl && /^https?:\/\//i.test(c.imgUrl) ? c.imgUrl : undefined,
        };
    }
    toNeutralChat(id, records, last, lidIndex) {
        const [c, ...others] = [...records].sort((a, b) => isPhoneKeyed(a.id) !== isPhoneKeyed(b.id) ? (isPhoneKeyed(a.id) ? -1 : 1) : a.id < b.id ? -1 : 1);
        const rawId = c.id;
        const recordIds = records.map(r => r.id);
        const st = this.chatState(rawId, recordIds, lidIndex);
        const deletedAt = this.deletedAtOf(this.stateKeys(rawId, recordIds, lidIndex), st?.deletedAt);
        const active = () => Math.max(last?.timestamp ?? 0, ...records.map(r => this.toUnixSeconds(r.conversationTimestamp)));
        if (deletedAt && active() * 1000 <= deletedAt)
            return null;
        return {
            id,
            name: c.name ?? others.find(o => o.name)?.name ?? this.resolveContactName(rawId),
            isGroup: rawId.endsWith('@g.us'),
            kind: (0, wa_id_1.chatKind)(id),
            unreadCount: [c, ...others]
                .filter(r => r.unreadCount != null)
                .sort((a, b) => this.toUnixSeconds(b.conversationTimestamp) - this.toUnixSeconds(a.conversationTimestamp))[0]
                ?.unreadCount ?? 0,
            timestamp: last?.timestamp ?? Math.max(...records.map(r => this.toUnixSeconds(r.conversationTimestamp))),
            lastMessage: last?.text,
            lastMessageType: last?.type,
            archived: st ? st.archived : (c.archived ?? false),
            pinned: st ? st.pinned : Boolean(c.pinned),
            muted: this.isMuted(st ? st.muteEndTime : c.muteEndTime),
            muteExpiration: this.muteExpirationMs(st ? st.muteEndTime : c.muteEndTime),
        };
    }
    isMuted(muteEndTime) {
        const raw = this.toUnixSeconds(muteEndTime);
        if (!raw)
            return false;
        if (raw < 0)
            return true;
        const endMs = raw < 1e12 ? raw * 1000 : raw;
        return endMs > Date.now();
    }
    muteExpirationMs(muteEndTime) {
        const raw = this.toUnixSeconds(muteEndTime);
        if (!raw)
            return undefined;
        if (raw < 0)
            return 0;
        const endMs = raw < 1e12 ? raw * 1000 : raw;
        return endMs > Date.now() ? endMs : undefined;
    }
    persistChatState(id, r) {
        if (!this.chatStateStore || !this.sessionId)
            return;
        const patch = {};
        if (Object.hasOwn(r, 'muteEndTime'))
            patch.muteEndTime = this.normalizeMuteEndTime(r.muteEndTime);
        if (Object.hasOwn(r, 'archived'))
            patch.archived = Boolean(r.archived);
        if (Object.hasOwn(r, 'pinned'))
            patch.pinned = Boolean(r.pinned);
        if (Object.keys(patch).length) {
            const key = this.stateKey(id);
            const twins = this.stateTwins([id], key);
            const create = Object.keys(r).every(f => f === 'id' || f === 'conditional' || Object.hasOwn(patch, f));
            void (twins.length
                ? this.chatStateStore.fold(this.sessionId, key, twins, patch, create)
                : this.chatStateStore.remember(this.sessionId, key, patch, create));
        }
    }
    stateKey(id) {
        const parsed = (0, wa_id_1.parseWaId)(id);
        if (parsed.kind === 'lid') {
            const phone = this.resolvePhone(id);
            return phone ? `${phone}@s.whatsapp.net` : `${parsed.userPart}@lid`;
        }
        return this.toEngineJid(id);
    }
    chatState(rawId, recordIds, lidIndex) {
        const store = this.chatStateStore;
        const sid = this.sessionId;
        if (!store || !sid)
            return undefined;
        return (0, baileys_chat_state_store_service_1.mergeTwinStates)(this.stateKeys(rawId, recordIds, lidIndex).flatMap(k => store.get(sid, k) ?? []));
    }
    stateKeys(rawId, recordIds, lidIndex) {
        const key = this.stateKey(rawId);
        return [key, ...this.stateTwins(recordIds, key, lidIndex)];
    }
    stateTwins(rawIds, key, lidIndex) {
        const parsed = (0, wa_id_1.parseWaId)(key);
        if (parsed.kind !== 'user')
            return [];
        const twins = new Set(lidIndex?.get(parsed.userPart));
        if (!lidIndex) {
            for (const [lid, pn] of this.lidToPn.entries()) {
                if ((0, wa_id_1.userPart)(pn) === parsed.userPart)
                    twins.add(`${(0, wa_id_1.userPart)(lid)}@lid`);
            }
        }
        for (const lid of this.lidStore?.lidsForPhone(parsed.userPart) ?? [])
            twins.add(`${lid}@lid`);
        for (const rawId of rawIds) {
            const raw = (0, wa_id_1.parseWaId)(rawId);
            if (raw.kind === 'lid')
                twins.add(`${raw.userPart}@lid`);
        }
        return [...twins];
    }
    lidKeysByPhone() {
        const index = new Map();
        for (const [lid, pn] of this.lidToPn.entries()) {
            const lids = index.get((0, wa_id_1.userPart)(pn));
            if (lids)
                lids.push(lid);
            else
                index.set((0, wa_id_1.userPart)(pn), [lid]);
        }
        return index;
    }
    lidsByPhone() {
        const index = new Map();
        for (const [lid, pn] of [...this.lidToPn.entries()]) {
            const phone = (0, wa_id_1.userPart)(pn);
            index.set(phone, [...(index.get(phone) ?? []), `${(0, wa_id_1.userPart)(lid)}@lid`]);
        }
        return index;
    }
    normalizeMuteEndTime(v) {
        const n = this.toUnixSeconds(v);
        if (!n)
            return null;
        if (n < 0)
            return -1;
        return n < 1e12 ? n * 1000 : n;
    }
    resolveContactName(id) {
        const direct = this.contactDisplayName(id);
        if (direct) {
            return direct;
        }
        const parsed = (0, wa_id_1.parseWaId)(id);
        if (parsed.kind === 'lid') {
            const lidJid = `${parsed.userPart}@lid`;
            const pn = this.lidToPn.get(lidJid) ??
                this.lidToPn.get(id) ??
                (this.contacts.get(lidJid) ?? this.contacts.get(id))?.phoneNumber;
            if (pn) {
                const viaPhone = this.contactDisplayName(pn) ??
                    this.contactDisplayName(`${(0, wa_id_1.userPart)(pn)}@s.whatsapp.net`) ??
                    this.contactDisplayName(`${(0, wa_id_1.userPart)(pn)}@c.us`);
                if (viaPhone) {
                    return viaPhone;
                }
            }
        }
        return (0, wa_id_1.userPart)(id);
    }
    contactDisplayName(id) {
        const c = this.contacts.get(id);
        return c ? (c.name ?? c.verifiedName ?? c.notify ?? undefined) : undefined;
    }
    toUnixSeconds(ts) {
        if (ts == null) {
            return 0;
        }
        return typeof ts === 'number' ? ts : ts.toNumber();
    }
}
exports.BaileysSessionStore = BaileysSessionStore;
//# sourceMappingURL=baileys-session-store.js.map