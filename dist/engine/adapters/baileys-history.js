"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaileysHistory = void 0;
exports.toUnixSeconds = toUnixSeconds;
const wa_id_1 = require("../identity/wa-id");
const baileys_message_mapper_1 = require("./baileys-message-mapper");
const baileys_query_deadline_1 = require("./baileys-query-deadline");
function toUnixSeconds(ts) {
    const now = () => Math.floor(Date.now() / 1000);
    if (ts == null) {
        return now();
    }
    if (typeof ts === 'number') {
        return Number.isFinite(ts) ? ts : now();
    }
    if (typeof ts === 'string') {
        const parsed = Number(ts);
        return Number.isFinite(parsed) ? parsed : now();
    }
    const converted = ts.toNumber();
    return Number.isFinite(converted) ? converted : now();
}
class BaileysHistory {
    host;
    constructor(host) {
        this.host = host;
    }
    addressbookRestored = false;
    sock() {
        return this.host.getSocket();
    }
    async captureHistoryMessages(messages) {
        if (!messages.length) {
            return;
        }
        const generation = this.host.getStoredWriteGeneration?.();
        const current = () => generation === this.host.getStoredWriteGeneration?.();
        const b = await this.host.loadLib();
        if (!current())
            return;
        const nameUpdates = [];
        const mapped = [];
        const revokes = [];
        const targets = new Map(messages.filter(msg => msg.key?.id).map(msg => [msg.key.id, msg]));
        for (const msg of messages) {
            if (msg.key?.fromMe !== true && msg.pushName) {
                const sender = (0, baileys_message_mapper_1.keyParticipant)(msg.key ?? {}) ?? msg.key?.remoteJid;
                if (sender) {
                    nameUpdates.push({ id: sender, notify: msg.pushName });
                }
            }
            const incoming = this.mapHistoryMessage(b, msg);
            if (incoming) {
                mapped.push(incoming);
            }
            else if (msg.key?.remoteJid) {
                const content = b.normalizeMessageContent(msg.message) ?? msg.message;
                const protocol = content?.protocolMessage;
                if (protocol && protocol.type === b.proto.Message.ProtocolMessage.Type.REVOKE && protocol.key?.id) {
                    revokes.push({ message: msg, target: protocol.key });
                }
            }
        }
        for (const { message, target } of revokes) {
            const original = targets.get(target.id);
            const key = await this.host.applyHistoryRevoke(original?.key ?? { ...target, remoteJid: target.remoteJid ?? message.key.remoteJid }, message.key);
            if (!current())
                return;
            if (!key?.remoteJid)
                continue;
            const cleared = this.revokedMessage(key, toUnixSeconds(original?.messageTimestamp ?? message.messageTimestamp));
            mapped.push(cleared);
        }
        if (nameUpdates.length) {
            this.host.upsertContacts(nameUpdates);
        }
        if (mapped.length) {
            const storedRevokes = await this.host.getOnHistoryMessages()?.(mapped);
            if (!current())
                return;
            const revoked = (storedRevokes ?? mapped).filter(m => m.type === 'revoked');
            const revokedKeys = new Set(revoked.map(m => JSON.stringify([m.id, m.chatId, m.fromMe])));
            for (const incoming of mapped) {
                if (incoming.type === 'revoked')
                    continue;
                const original = targets.get(incoming.id);
                const deleted = revokedKeys.has(JSON.stringify([incoming.id, incoming.chatId, incoming.fromMe]));
                this.host.recordMessage(original, deleted ? 'revoked' : incoming.type, 0);
            }
            for (const m of revoked) {
                this.host.recordMessageEdit(m.chatId, m.id, '', 'revoked');
                if ((0, wa_id_1.parseWaId)(m.chatId).kind === 'lid') {
                    const phone = await this.host.findPersistedLidPhone?.(m.chatId).catch(() => null);
                    if (!current())
                        return;
                    if (phone)
                        this.host.recordMessageEdit(`${phone}@s.whatsapp.net`, m.id, '', 'revoked');
                }
            }
        }
    }
    revokedMessage(key, timestamp) {
        const message = (0, baileys_message_mapper_1.buildIncomingMessageFromBaileys)({
            id: key.id,
            remoteJid: key.remoteJid,
            fromMe: key.fromMe === true,
            participant: (0, baileys_message_mapper_1.keyParticipant)(key),
            body: '',
            contentType: undefined,
            timestamp,
            selfJid: this.host.normalizedSelfJid(),
        }, jid => this.host.toNeutralJid(jid));
        return { ...message, type: 'revoked' };
    }
    async hydrateNames() {
        try {
            const groups = await (0, baileys_query_deadline_1.withQueryDeadline)(this.sock().groupFetchAllParticipating(), baileys_query_deadline_1.BAILEYS_QUERY_BUDGET_MS, 'WhatsApp did not answer the group list query in time');
            const named = Object.values(groups)
                .filter(g => g?.id && g.subject)
                .map(g => ({ id: g.id, name: g.subject }));
            if (named.length) {
                this.host.upsertChats(named);
                this.host.logger.debug('Hydrated group names', { action: 'baileys_hydrate_groups', count: named.length });
            }
        }
        catch (err) {
            this.host.logger.warn('Group name hydration failed', { error: err instanceof Error ? err.message : String(err) });
        }
        try {
            const b = await this.host.loadLib();
            const collections = b.ALL_WA_PATCH_NAMES;
            if (!collections?.length) {
                return;
            }
            const alreadySynced = (this.sock().authState?.creds?.accountSyncCounter ?? 0) > 0;
            if (alreadySynced && !this.addressbookRestored) {
                this.addressbookRestored = true;
                try {
                    await this.restoreAddressbookSnapshot();
                }
                catch (err) {
                    this.addressbookRestored = false;
                    throw err;
                }
            }
            await this.sock().resyncAppState(collections, false);
            this.host.logger.debug('Re-synced app state for contact names', { action: 'baileys_resync_appstate' });
        }
        catch (err) {
            this.host.logger.warn('App-state resync for contact names failed', {
                error: err instanceof Error ? err.message : String(err),
            });
        }
    }
    static ADDRESSBOOK_COLLECTION = 'critical_unblock_low';
    async restoreAddressbookSnapshot() {
        const name = BaileysHistory.ADDRESSBOOK_COLLECTION;
        await this.sock().authState.keys.set({ 'app-state-sync-version': { [name]: null } });
        await this.sock().resyncAppState([name], true);
        this.host.logger.debug('Restored address-book snapshot', {
            action: 'baileys_restore_addressbook',
            contacts: this.host.contactCount(),
        });
    }
    mapHistoryMessage(b, msg) {
        const raw = msg.message;
        if (!raw || !msg.key?.remoteJid || !msg.key.id) {
            return null;
        }
        const content = b.normalizeMessageContent(raw) ?? raw;
        const contentType = b.getContentType(content);
        if (!contentType ||
            contentType === 'protocolMessage' ||
            contentType === 'reactionMessage' ||
            contentType === 'senderKeyDistributionMessage' ||
            baileys_message_mapper_1.BAILEYS_NON_CONTENT_TYPES.has(contentType)) {
            return null;
        }
        const body = (0, baileys_message_mapper_1.extractBaileysBody)(content);
        const context = (0, baileys_message_mapper_1.extractBaileysContext)(content);
        const commerce = (0, baileys_message_mapper_1.extractBaileysCommerce)(content, contentType);
        const button = (0, baileys_message_mapper_1.extractBaileysButtonReply)(content, contentType);
        const buttons = (0, baileys_message_mapper_1.extractBaileysButtons)(content, contentType);
        return (0, baileys_message_mapper_1.buildIncomingMessageFromBaileys)({
            id: msg.key.id,
            remoteJid: msg.key.remoteJid,
            fromMe: msg.key.fromMe === true,
            participant: (0, baileys_message_mapper_1.keyParticipant)(msg.key),
            body,
            contentType,
            isPtt: content.audioMessage?.ptt === true,
            timestamp: toUnixSeconds(msg.messageTimestamp),
            pushName: msg.pushName ?? undefined,
            selfJid: this.host.normalizedSelfJid(),
            order: commerce.order,
            product: commerce.product,
            poll: (0, baileys_message_mapper_1.extractBaileysPoll)(content),
            button,
            buttons,
            quotedMessage: context.quotedMessage,
            mentionedJids: context.mentionedJids,
            isCatalogShare: (0, baileys_message_mapper_1.isBaileysCatalogShare)(content),
            ephemeralDuration: this.host.extractEphemeralDuration(msg),
        }, jid => this.host.toNeutralJid(jid));
    }
}
exports.BaileysHistory = BaileysHistory;
//# sourceMappingURL=baileys-history.js.map