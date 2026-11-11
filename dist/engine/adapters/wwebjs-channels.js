"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WwebjsChannels = void 0;
const whatsapp_web_js_types_1 = require("../types/whatsapp-web-js.types");
const engine_not_supported_error_1 = require("../../common/errors/engine-not-supported.error");
const engine_refused_error_1 = require("../../common/errors/engine-refused.error");
const channel_not_found_error_1 = require("../../common/errors/channel-not-found.error");
const wwebjs_host_1 = require("./wwebjs-host");
class WwebjsChannels {
    host;
    constructor(host) {
        this.host = host;
    }
    client() {
        return this.host.getClient();
    }
    withPage(context, op) {
        return (0, wwebjs_host_1.withPage)(this.host, context, op);
    }
    async getSubscribedChannels() {
        this.host.ensureReady();
        const channels = await this.withPage('getSubscribedChannels', () => this.client().getChannels());
        if (!channels) {
            return [];
        }
        return channels.map((ch) => ({
            id: (0, whatsapp_web_js_types_1.readWid)(ch.id) || '',
            name: String(ch.name || ''),
            description: ch.description ? String(ch.description) : undefined,
            inviteCode: ch.inviteCode ? String(ch.inviteCode) : undefined,
            subscriberCount: ch.subscriberCount ? Number(ch.subscriberCount) : undefined,
            verified: ch.verified ? Boolean(ch.verified) : undefined,
        }));
    }
    async createChannel(name, description) {
        this.host.ensureReady();
        const result = await (0, wwebjs_host_1.reportPageDeath)(this.host, 'createChannel', () => this.client().createChannel(name, description === undefined ? {} : { description }));
        if (typeof result === 'string' || !result?.nid) {
            throw new engine_refused_error_1.EngineRefusedError(typeof result === 'string' ? result : `Failed to create the channel '${name}'`);
        }
        const channelId = (0, whatsapp_web_js_types_1.readWid)(result.nid);
        if (!channelId) {
            throw new engine_refused_error_1.EngineRefusedError(`Channel '${name}' was created but its id was unreadable — refusing to return it`);
        }
        return {
            id: String(channelId),
            name: String(result.title ?? name),
            ...(description === undefined ? {} : { description }),
            ...(result.inviteLink ? { inviteCode: result.inviteLink.split('/').pop() } : {}),
        };
    }
    async demoteChannelAdmin(_channelId, _userId) {
        this.host.ensureReady();
        throw new engine_not_supported_error_1.EngineNotSupportedError('demoteChannelAdmin');
    }
    async transferChannelOwnership(_channelId, _newOwnerId) {
        this.host.ensureReady();
        throw new engine_not_supported_error_1.EngineNotSupportedError('transferChannelOwnership');
    }
    async deleteChannel(channelId) {
        this.host.ensureReady();
        const ok = await this.withPage('deleteChannel', () => this.client().deleteChannel(channelId));
        if (!ok) {
            throw new engine_refused_error_1.EngineRefusedError(`Failed to delete channel ${channelId}`);
        }
    }
    async muteChannel(channelId, mute) {
        this.host.ensureReady();
        if (!channelId.endsWith('@newsletter')) {
            throw new channel_not_found_error_1.ChannelNotFoundError(channelId);
        }
        const chat = (await this.withPage('muteChannel', () => this.client().getChatById(channelId)));
        const act = mute ? chat?.mute : chat?.unmute;
        if (!act) {
            throw new channel_not_found_error_1.ChannelNotFoundError(channelId);
        }
        this.host.ensureReady();
        const ok = await this.withPage('muteChannel', () => act.call(chat));
        if (!ok) {
            throw new engine_refused_error_1.EngineRefusedError(`Failed to ${mute ? 'mute' : 'unmute'} channel ${channelId}`);
        }
    }
    async getChannelById(channelId) {
        this.host.ensureReady();
        const channels = await this.getSubscribedChannels();
        return channels.find(c => c.id === channelId) ?? null;
    }
    async subscribeToChannel(_inviteCode) {
        this.host.ensureReady();
        throw new engine_not_supported_error_1.EngineNotSupportedError('subscribeToChannel');
    }
    async unsubscribeFromChannel(channelId) {
        this.host.ensureReady();
        const ok = await this.withPage('unsubscribeFromChannel', () => this.client().unsubscribeFromChannel(channelId));
        if (!ok) {
            throw new engine_refused_error_1.EngineRefusedError(`Failed to unsubscribe from channel ${channelId}`);
        }
        this.host.logger.debug('Unsubscribed from channel', { channelId });
    }
    async getChannelMessages(channelId, limit = 50) {
        this.host.ensureReady();
        const channels = await this.withPage('getChannelMessages', () => this.client().getChannels());
        const channel = channels?.find(c => (0, whatsapp_web_js_types_1.readWid)(c.id) === channelId);
        if (!channel) {
            throw new channel_not_found_error_1.ChannelNotFoundError(channelId);
        }
        const safeLimit = Number.isFinite(limit) && limit >= 1 ? Math.trunc(limit) : 50;
        const messages = await this.withPage('getChannelMessages', () => channel.fetchMessages({ limit: safeLimit }));
        return (messages ?? []).map(msg => ({
            id: (0, whatsapp_web_js_types_1.readWid)(msg.id) || '',
            body: String(msg.body || ''),
            timestamp: Number(msg.timestamp),
            hasMedia: Boolean(msg.hasMedia),
        }));
    }
}
exports.WwebjsChannels = WwebjsChannels;
//# sourceMappingURL=wwebjs-channels.js.map