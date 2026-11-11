"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaileysContacts = void 0;
const engine_not_ready_error_1 = require("../../common/errors/engine-not-ready.error");
const baileys_identity_query_1 = require("./baileys-identity-query");
const baileys_messaging_1 = require("./baileys-messaging");
const baileys_query_deadline_1 = require("./baileys-query-deadline");
const engine_transport_error_1 = require("../../common/errors/engine-transport.error");
const recipient_unreachable_error_1 = require("../../common/errors/recipient-unreachable.error");
const lid_not_mapped_error_1 = require("../../common/errors/lid-not-mapped.error");
const wa_id_1 = require("../identity/wa-id");
const baileys_message_mapper_1 = require("./baileys-message-mapper");
const baileys_groups_1 = require("./baileys-groups");
class BaileysContacts {
    host;
    queryBudgetMs;
    constructor(host, queryBudgetMs = baileys_query_deadline_1.BAILEYS_QUERY_BUDGET_MS) {
        this.host = host;
        this.queryBudgetMs = queryBudgetMs;
    }
    confirmed(work, operation) {
        return (0, baileys_query_deadline_1.confirmedWrite)(work, this.queryBudgetMs, operation);
    }
    sock(expected) {
        const socket = this.host.getSocket();
        if (expected && socket !== expected)
            throw new engine_not_ready_error_1.EngineNotReadyError();
        return socket;
    }
    async getProfilePicture(contactId) {
        this.host.ensureReady();
        try {
            const url = await (0, baileys_query_deadline_1.withQueryDeadline)(this.sock().profilePictureUrl(contactId, 'image'), this.queryBudgetMs, 'WhatsApp did not answer the profile picture lookup in time');
            return url ?? null;
        }
        catch (err) {
            if (err instanceof engine_transport_error_1.EngineTransportError) {
                throw err;
            }
            const code = (0, baileys_groups_1.refusedStatusCode)(err);
            if (code === undefined) {
                throw new engine_transport_error_1.EngineTransportError('WhatsApp did not answer the profile picture lookup');
            }
            if (code === 408 || code === 429 || code >= 500) {
                throw new engine_transport_error_1.EngineTransportError(`WhatsApp could not answer the profile picture lookup (code ${code})`);
            }
            this.host.logger.debug('profilePictureUrl failed; no picture or hidden', {
                contactId,
                error: err instanceof Error ? err.message : String(err),
            });
            return null;
        }
    }
    async upsertContact(contactId, firstName, lastName = '') {
        this.host.ensureReady();
        const fullName = [firstName, lastName].filter(Boolean).join(' ');
        await this.confirmed(this.sock().addOrEditContact(this.host.toEngineJid(contactId), {
            firstName,
            fullName,
            saveOnPrimaryAddressbook: false,
        }), 'the contact save');
    }
    async deleteContact(contactId) {
        this.host.ensureReady();
        await this.confirmed(this.sock().removeContact(this.host.toEngineJid(contactId)), 'the contact removal');
    }
    async mapUnresolvableId(contactId, op) {
        try {
            return await op();
        }
        catch (error) {
            const status = error?.output?.statusCode;
            if (status === 400)
                throw new recipient_unreachable_error_1.RecipientUnreachableError(contactId);
            throw error;
        }
    }
    async blockContact(contactId) {
        this.host.ensureReady();
        await this.mapUnresolvableId(contactId, () => this.confirmed(this.sock().updateBlockStatus(contactId, 'block'), 'the block'));
        this.invalidateBlocklist();
    }
    async unblockContact(contactId) {
        this.host.ensureReady();
        await this.mapUnresolvableId(contactId, () => this.confirmed(this.sock().updateBlockStatus(contactId, 'unblock'), 'the unblock'));
        this.invalidateBlocklist();
    }
    async getBlockedContacts(budgetMs = this.queryBudgetMs) {
        this.host.ensureReady();
        const jids = await (0, baileys_query_deadline_1.withQueryDeadline)(this.sock().fetchBlocklist(), budgetMs, 'WhatsApp did not answer the blocklist query in time');
        const ids = (jids ?? []).filter((jid) => Boolean(jid)).map(jid => this.host.toNeutralJid(jid));
        return [...new Set(ids)];
    }
    async setProfileName(name) {
        this.host.ensureReady();
        await this.confirmed(this.sock().updateProfileName(name), 'the profile name change');
    }
    async setProfileStatus(status) {
        this.host.ensureReady();
        await this.confirmed(this.sock().updateProfileStatus(status), 'the profile status change');
    }
    async setProfilePicture(media) {
        this.host.ensureReady();
        const selfJid = this.host.normalizedSelfJid();
        if (!selfJid) {
            throw new Error('cannot set the profile picture: the own JID is not known yet');
        }
        const { data } = await (0, baileys_messaging_1.resolveMediaBuffer)(media, this.host.sessionProxyUrl());
        await (0, baileys_messaging_1.assertReadableImage)(data);
        await this.confirmed(this.sock().updateProfilePicture(selfJid, data), 'the profile picture change');
    }
    async deleteProfilePicture() {
        this.host.ensureReady();
        const selfJid = this.host.normalizedSelfJid();
        if (!selfJid) {
            throw new Error('cannot delete the profile picture: the own JID is not known yet');
        }
        await this.confirmed(this.sock().removeProfilePicture(selfJid), 'the profile picture removal');
    }
    async getContacts() {
        this.host.ensureReady();
        return this.withBlockedState(this.host.listContacts());
    }
    async getContactById(contactId) {
        this.host.ensureReady();
        const contact = this.host.findContact(contactId);
        if (!contact)
            return null;
        if (!(0, baileys_message_mapper_1.storedKeyInChat)({ remoteJid: contact.id }, contactId, wa_id_1.toNeutralJid) &&
            !(await this.matchesChat({ remoteJid: contact.id }, contactId)))
            return null;
        return (await this.withBlockedState([contact]))[0];
    }
    async withBlockedState(contacts) {
        if (contacts.length === 0)
            return contacts;
        const blocked = await this.blockedIds();
        if (!blocked)
            return contacts;
        return contacts.map(contact => ({ ...contact, isBlocked: blocked.has(contact.id) }));
    }
    blocklistMemo;
    blocklistInFlight;
    blocklistGeneration = 0;
    static BLOCKLIST_MEMO_MS = 5_000;
    static BLOCKLIST_ENRICHMENT_BUDGET_MS = 5_000;
    async blockedIds() {
        if (this.blocklistMemo && Date.now() - this.blocklistMemo.at < BaileysContacts.BLOCKLIST_MEMO_MS) {
            return this.blocklistMemo.ids;
        }
        this.blocklistInFlight ??= this.queryBlockedIds();
        return this.blocklistInFlight;
    }
    async queryBlockedIds() {
        const generation = this.blocklistGeneration;
        let ids;
        try {
            ids = new Set(await this.getBlockedContacts(BaileysContacts.BLOCKLIST_ENRICHMENT_BUDGET_MS));
        }
        catch (error) {
            this.host.logger.warn('Blocklist unavailable; contact isBlocked left at its default', {
                error: error instanceof Error ? error.message : String(error),
            });
            ids = null;
        }
        finally {
            if (generation === this.blocklistGeneration) {
                this.blocklistInFlight = undefined;
            }
        }
        if (generation === this.blocklistGeneration) {
            this.blocklistMemo = { at: Date.now(), ids };
        }
        return ids;
    }
    invalidateBlocklist() {
        this.blocklistMemo = undefined;
        this.blocklistInFlight = undefined;
        this.blocklistGeneration += 1;
    }
    async resolveContactPhone(contactId) {
        this.host.ensureReady();
        const cached = this.host.resolvePhone(contactId);
        if (cached || (0, wa_id_1.parseWaId)(contactId).kind !== 'lid')
            return cached;
        const persisted = await this.host.findPersistedLidPhone(contactId);
        if (persisted)
            return persisted;
        const pn = await this.sock()
            .signalRepository?.lidMapping?.getPNForLID(contactId)
            .catch(() => null);
        if (pn) {
            this.host.recordLidMapping(contactId, pn, false);
            return (0, wa_id_1.userPart)(pn);
        }
        throw new lid_not_mapped_error_1.LidNotMappedError(contactId);
    }
    async getChats() {
        this.host.ensureReady();
        return this.host.listChats();
    }
    async sendSeen(chatId, messageIds, authors, stored) {
        this.host.ensureReady();
        const socket = this.sock();
        const keys = await this.receiptKeys(socket, chatId, messageIds, authors, stored);
        if (keys.length === 0) {
            return false;
        }
        await this.confirmed(this.sock(socket).readMessages(keys), 'the read receipt');
        return true;
    }
    async receiptKeys(socket, chatId, messageIds, authors, storedLast) {
        if (messageIds === undefined || messageIds === null) {
            const last = this.sinceDeletion(chatId, this.host.lastInboundMessage(chatId));
            if (last && (await this.matchesChat(last.key, chatId, socket)))
                return [last.key];
            if (!isEngineChatId(chatId))
                return [];
            const row = this.sinceDeletion(chatId, await this.readStored(chatId, storedLast));
            const received = row && !row.fromMe ? this.storedTarget(chatId, row) : null;
            return received && (await this.matchesChat(received.key, chatId, socket)) ? [received.key] : [];
        }
        if (messageIds.length === 0) {
            return [];
        }
        const remoteJid = this.host.toEngineJid(chatId);
        const stored = (await this.host.getStoredMessages(messageIds)) ?? [];
        const keyById = new Map();
        for (const msg of stored) {
            if (msg.key?.id && msg.key.remoteJid && (await this.matchesChat(msg.key, chatId, socket))) {
                keyById.set(msg.key.id, msg.key);
            }
        }
        const inGroup = (0, wa_id_1.chatKind)(remoteJid) === 'group';
        return messageIds.flatMap((id) => {
            const key = keyById.get(id);
            if (key)
                return [key];
            if (!inGroup)
                return [{ remoteJid, id, fromMe: false }];
            const author = authors?.get(id);
            return author ? [{ remoteJid, id, fromMe: false, participant: this.host.toEngineJid(author) }] : [];
        });
    }
    async matchesChat(key, chatId, expected) {
        const socket = this.sock(expected);
        const persisted = await (0, baileys_message_mapper_1.storedKeyInChatPersisted)(key, chatId, jid => this.host.findPersistedLidPhone(jid));
        this.sock(socket);
        if (persisted)
            return true;
        const requested = (0, wa_id_1.parseWaId)(chatId);
        const stored = (0, wa_id_1.parseWaId)(key.remoteJid ?? '');
        if (!((requested.kind === 'user' && stored.kind === 'lid') || (requested.kind === 'lid' && stored.kind === 'user')))
            return false;
        const phone = requested.kind === 'user' ? requested.userPart : stored.userPart;
        const lid = requested.kind === 'lid' ? requested.userPart : stored.userPart;
        if (typeof socket.executeUSyncQuery !== 'function' || !this.host.loadLib)
            return false;
        const library = await this.host.loadLib();
        this.sock(socket);
        const confirmed = await (0, baileys_identity_query_1.queryLidPhone)(socket, library, phone, lid, this.queryBudgetMs);
        this.sock(socket);
        if (confirmed)
            this.host.recordLidMapping(`${lid}@lid`, `${phone}@s.whatsapp.net`);
        return confirmed;
    }
    async confirmedChatJid(chatId) {
        const jid = this.host.chatJid(chatId);
        if (!(await this.matchesChat({ remoteJid: jid }, chatId)))
            throw new recipient_unreachable_error_1.RecipientUnreachableError(chatId);
        return jid;
    }
    async chatWriteRange(socket, chatId, stored, rangeless = () => false) {
        const last = this.sinceDeletion(chatId, this.host.lastMessage(chatId));
        const inMemory = last ? this.memoryTarget(chatId, last.key, last.timestamp) : null;
        if (inMemory && (await this.matchesChat(inMemory.key, chatId, socket)))
            return toRange(inMemory);
        if (!isEngineChatId(chatId))
            return null;
        const row = this.sinceDeletion(chatId, await this.readStored(chatId, stored));
        const fromStore = row ? this.storedTarget(chatId, row) : null;
        if (fromStore && (await this.matchesChat(fromStore.key, chatId, socket)))
            return toRange(fromStore);
        if (!rangeless() || !(last || row || this.listedChats(chatId).length))
            return null;
        const jid = this.host.chatJid(chatId);
        return (await this.matchesChat({ remoteJid: jid }, chatId, socket)) ? { jid, lastMessages: [] } : null;
    }
    async readStored(chatId, stored) {
        if (!stored)
            return null;
        try {
            return await stored();
        }
        catch (err) {
            this.host.logger.warn('Could not read the stored last message of a chat', {
                chatId,
                error: err instanceof Error ? err.message : String(err),
            });
            return null;
        }
    }
    sinceDeletion(chatId, message) {
        const deletedAt = this.host.chatDeletedAt(chatId);
        return message && (deletedAt === null || message.timestamp * 1000 > deletedAt) ? message : null;
    }
    memoryTarget(chatId, key, timestamp) {
        if (!key.id || !timestamp)
            return null;
        const chatJid = this.host.chatJid(chatId);
        const group = (0, wa_id_1.parseWaId)(chatJid).kind === 'group';
        const fromMe = key.fromMe === true;
        if (group && !fromMe && !key.participant)
            return null;
        const jid = group ? chatJid : this.host.toEngineJid(key.remoteJid ?? chatJid);
        return target(jid, key.id, fromMe, group && !fromMe ? (key.participant ?? undefined) : undefined, timestamp);
    }
    storedTarget(chatId, row) {
        if (!row.id || !row.timestamp)
            return null;
        const chatJid = this.host.chatJid(chatId);
        const group = (0, wa_id_1.parseWaId)(chatJid).kind === 'group';
        if (group && !row.fromMe && !row.author)
            return null;
        const jid = group ? chatJid : (row.lid ?? this.host.lidOf(chatJid) ?? this.host.toEngineJid(chatJid));
        const participant = group && !row.fromMe && row.author
            ? (row.authorLid ?? this.host.lidOf(row.author) ?? this.host.toEngineJid(row.author))
            : undefined;
        return target(jid, row.id, row.fromMe, participant, row.timestamp);
    }
    listedChats(chatId) {
        const ids = new Set(this.host.chatTwins(chatId).map(jid => this.host.toNeutralJid(jid)));
        return this.host.listChats().filter(chat => ids.has(chat.id));
    }
    async markUnread(chatId, stored) {
        this.host.ensureReady();
        const socket = this.sock();
        const range = await this.chatWriteRange(socket, chatId, stored, () => !this.listedChats(chatId).some(c => c.archived));
        if (!range)
            return false;
        await this.confirmed(this.sock(socket).chatModify({ markRead: false, lastMessages: range.lastMessages }, range.jid), 'the unread mark');
        return true;
    }
    async clearChatMessages(chatId, stored) {
        this.host.ensureReady();
        const socket = this.sock();
        const range = await this.chatWriteRange(socket, chatId, stored);
        if (!range) {
            return false;
        }
        await this.confirmed(this.sock(socket).chatModify({ clear: true, lastMessages: range.lastMessages }, range.jid), 'the chat clear');
        return true;
    }
    async archiveChat(chatId, archive, stored) {
        this.host.ensureReady();
        const socket = this.sock();
        const range = await this.chatWriteRange(socket, chatId, stored, () => true);
        if (!range)
            return false;
        await this.confirmed(this.sock(socket).chatModify({ archive, lastMessages: range.lastMessages }, range.jid), 'the archive change');
        return true;
    }
    async muteChat(chatId, muteUntil) {
        this.host.ensureReady();
        const socket = this.sock();
        const jid = await this.confirmedChatJid(chatId);
        await this.confirmed(this.sock(socket).chatModify({ mute: muteUntil }, jid), 'the mute change');
    }
    async pinChat(chatId, pin) {
        this.host.ensureReady();
        const socket = this.sock();
        const jid = await this.confirmedChatJid(chatId);
        await this.confirmed(this.sock(socket).chatModify({ pin }, jid), 'the pin change');
        return true;
    }
    async deleteChat(chatId, stored) {
        this.host.ensureReady();
        const socket = this.sock();
        const range = await this.chatWriteRange(socket, chatId, stored);
        if (!range) {
            return false;
        }
        await this.confirmed(this.sock(socket).chatModify({ delete: true, lastMessages: range.lastMessages }, range.jid), 'the chat delete');
        return true;
    }
}
exports.BaileysContacts = BaileysContacts;
function target(jid, id, fromMe, participant, timestamp) {
    return { jid, key: { remoteJid: jid, fromMe, id, ...(participant ? { participant } : {}) }, timestamp };
}
function toRange(write) {
    return { jid: write.jid, lastMessages: [{ key: write.key, messageTimestamp: write.timestamp }] };
}
function isEngineChatId(chatId) {
    const { kind, userPart: id } = (0, wa_id_1.parseWaId)(chatId);
    const domains = kind === 'group' ? ['g.us'] : kind === 'lid' ? ['lid'] : kind === 'user' ? ['c.us', 's.whatsapp.net'] : [];
    return domains.some(domain => chatId === `${id}@${domain}`);
}
//# sourceMappingURL=baileys-contacts.js.map