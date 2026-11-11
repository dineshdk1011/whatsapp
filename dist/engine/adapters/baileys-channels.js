"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaileysChannels = void 0;
exports.wmexRefusalCode = wmexRefusalCode;
const channel_not_found_error_1 = require("../../common/errors/channel-not-found.error");
const engine_transport_error_1 = require("../../common/errors/engine-transport.error");
const baileys_groups_1 = require("./baileys-groups");
const baileys_query_deadline_1 = require("./baileys-query-deadline");
function wmexRefusalCode(error) {
    const err = error;
    if (typeof err?.data === 'number') {
        return err.data;
    }
    const node = err?.data;
    const isGraphQlError = typeof node === 'object' && node !== null && ('message' in node || 'extensions' in node);
    if (isGraphQlError && typeof err?.output?.statusCode === 'number') {
        return err.output.statusCode;
    }
    return undefined;
}
function finiteNumber(value) {
    const n = typeof value === 'string' ? Number.parseInt(value, 10) : value;
    return n !== undefined && Number.isFinite(n) ? n : undefined;
}
class BaileysChannels {
    host;
    queryBudgetMs;
    constructor(host, queryBudgetMs = baileys_query_deadline_1.BAILEYS_QUERY_BUDGET_MS) {
        this.host = host;
        this.queryBudgetMs = queryBudgetMs;
    }
    bounded(work, operation) {
        return (0, baileys_query_deadline_1.withQueryDeadline)(work, this.queryBudgetMs, `WhatsApp did not answer ${operation} in time`);
    }
    sock() {
        return this.host.getSocket();
    }
    async getChannelById(channelId) {
        this.host.ensureReady();
        const meta = await this.lookup('jid', channelId, 'the channel lookup');
        return meta ? this.toChannel(meta) : null;
    }
    async subscribeToChannel(inviteCode) {
        this.host.ensureReady();
        const meta = await this.lookup('invite', inviteCode, 'the invite lookup');
        if (!meta) {
            throw new channel_not_found_error_1.ChannelNotFoundError(inviteCode);
        }
        await (0, baileys_groups_1.mapServerRefusal)('Subscribing to the channel', () => this.bounded(this.sock().newsletterFollow(meta.id), 'the channel subscribe'), wmexRefusalCode);
        return this.toChannel(meta);
    }
    async lookup(type, key, operation) {
        try {
            return await this.bounded(this.sock().newsletterMetadata(type, key), operation);
        }
        catch (error) {
            const code = wmexRefusalCode(error);
            if (code === 408 || code === 429) {
                throw new engine_transport_error_1.EngineTransportError(`WhatsApp rate-limited or timed out ${operation} (code ${code})`);
            }
            if (code !== undefined && code >= 400 && code < 500) {
                return null;
            }
            throw error;
        }
    }
    async createChannel(name, description) {
        this.host.ensureReady();
        const meta = await (0, baileys_groups_1.mapServerRefusal)('Creating the channel', () => this.sock().newsletterCreate(name, description), error => {
            const code = wmexRefusalCode(error);
            return code === 408 ? undefined : code;
        });
        return this.toChannel(meta);
    }
    async demoteChannelAdmin(channelId, userId) {
        this.host.ensureReady();
        const userJid = this.host.toEngineJid(userId);
        await (0, baileys_groups_1.mapServerRefusal)('Demoting the channel admin', () => this.bounded(this.sock().newsletterDemote(channelId, userJid), 'the channel admin demotion'), wmexRefusalCode);
    }
    async transferChannelOwnership(channelId, newOwnerId) {
        this.host.ensureReady();
        const newOwnerJid = this.host.toEngineJid(newOwnerId);
        await (0, baileys_groups_1.mapServerRefusal)('Transferring the channel ownership', () => this.bounded(this.sock().newsletterChangeOwner(channelId, newOwnerJid), 'the channel ownership transfer'), wmexRefusalCode);
    }
    async deleteChannel(channelId) {
        this.host.ensureReady();
        await (0, baileys_groups_1.mapServerRefusal)('Deleting the channel', () => this.bounded(this.sock().newsletterDelete(channelId), 'the channel delete'), wmexRefusalCode);
    }
    async muteChannel(channelId, mute) {
        this.host.ensureReady();
        await (0, baileys_groups_1.mapServerRefusal)(mute ? 'Muting the channel' : 'Unmuting the channel', () => this.bounded(mute ? this.sock().newsletterMute(channelId) : this.sock().newsletterUnmute(channelId), mute ? 'the channel mute' : 'the channel unmute'), wmexRefusalCode);
    }
    async unsubscribeFromChannel(channelId) {
        this.host.ensureReady();
        await (0, baileys_groups_1.mapServerRefusal)('Unsubscribing from the channel', () => this.bounded(this.sock().newsletterUnfollow(channelId), 'the channel unsubscribe'), wmexRefusalCode);
    }
    toChannel(meta) {
        const thread = meta.thread_metadata;
        const description = meta.description ?? thread?.description?.text;
        const invite = meta.invite ?? thread?.invite;
        const subscriberCount = finiteNumber(meta.subscribers) ?? finiteNumber(thread?.subscribers_count);
        const verification = meta.verification ?? thread?.verification;
        const createdAt = finiteNumber(meta.creation_time) ?? finiteNumber(thread?.creation_time);
        return {
            id: meta.id,
            name: meta.name ?? thread?.name?.text ?? '',
            ...(description ? { description } : {}),
            ...(invite ? { inviteCode: invite } : {}),
            ...(subscriberCount !== undefined ? { subscriberCount } : {}),
            ...(verification ? { verified: verification === 'VERIFIED' } : {}),
            ...(createdAt !== undefined ? { createdAt } : {}),
        };
    }
}
exports.BaileysChannels = BaileysChannels;
//# sourceMappingURL=baileys-channels.js.map