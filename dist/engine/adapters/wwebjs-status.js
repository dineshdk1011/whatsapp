"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WwebjsStatus = void 0;
exports.toStatusResult = toStatusResult;
const common_1 = require("@nestjs/common");
const whatsapp_web_js_1 = require("whatsapp-web.js");
const whatsapp_web_js_types_1 = require("../types/whatsapp-web-js.types");
const engine_refused_error_1 = require("../../common/errors/engine-refused.error");
const wwebjs_messaging_1 = require("./wwebjs-messaging");
const wwebjs_host_1 = require("./wwebjs-host");
function toStatusResult(msg) {
    if (!msg) {
        throw new common_1.InternalServerErrorException('the engine returned no message for this status post, so it may not have been published — check your status before retrying');
    }
    const id = msg.id;
    const ts = msg.timestamp ? new Date(msg.timestamp * 1000) : new Date();
    return {
        statusId: (0, whatsapp_web_js_types_1.readWid)(id) ?? '',
        timestamp: ts,
        expiresAt: new Date(ts.getTime() + 24 * 3_600_000),
    };
}
class WwebjsStatus {
    host;
    constructor(host) {
        this.host = host;
    }
    client() {
        return (0, wwebjs_host_1.requireClient)(this.host);
    }
    withPage(context, op) {
        return (0, wwebjs_host_1.withPage)(this.host, context, op);
    }
    async getContactStatuses() {
        this.host.ensureReady();
        return this.collectStatuses(await this.withPage('getContactStatuses', () => this.client().getBroadcasts()));
    }
    async getContactStatus(contactId) {
        this.host.ensureReady();
        const broadcast = await this.withPage('getContactStatus', () => this.client().getBroadcastById(contactId));
        return broadcast?.msgs?.length ? this.collectStatuses([broadcast]) : [];
    }
    async collectStatuses(broadcasts) {
        const statuses = [];
        for (const broadcast of broadcasts) {
            if (!broadcast?.msgs?.length) {
                continue;
            }
            const contact = await broadcast.getContact();
            const contactSummary = {
                id: contact.id._serialized,
                ...(contact.name ? { name: contact.name } : {}),
                ...(contact.pushname ? { pushName: contact.pushname } : {}),
            };
            for (const msg of broadcast.msgs) {
                const ts = new Date(msg.timestamp * 1000);
                let media;
                if (msg.hasMedia) {
                    try {
                        media = await this.host.capInboundMediaFor(msg);
                    }
                    catch (error) {
                        this.host.logger.warn(`Failed to download media for status ${msg.id._serialized}: ${String(error)}`);
                    }
                }
                statuses.push({
                    id: (0, whatsapp_web_js_types_1.readWid)(msg.id) || '',
                    contact: contactSummary,
                    type: msg.type === whatsapp_web_js_1.MessageTypes.IMAGE
                        ? 'image'
                        : msg.type === whatsapp_web_js_1.MessageTypes.VIDEO
                            ? 'video'
                            :
                                msg.type === whatsapp_web_js_1.MessageTypes.VOICE
                                    ? 'voice'
                                    : 'text',
                    ...(msg.body ? { caption: msg.body } : {}),
                    ...(media ? { media } : {}),
                    timestamp: ts,
                    expiresAt: new Date(ts.getTime() + 24 * 3_600_000),
                });
            }
        }
        return statuses;
    }
    warnedStatusRecipients = false;
    async postTextStatus(text, options) {
        this.host.ensureReady();
        this.warnStatusRecipientsOnce(options);
        const msg = await (0, wwebjs_host_1.reportPageDeath)(this.host, 'postTextStatus', () => this.client().sendMessage('status@broadcast', text, {
            extra: {
                ...(options.backgroundColor !== undefined ? { backgroundColor: options.backgroundColor } : {}),
                ...(options.font !== undefined ? { fontStyle: options.font } : {}),
            },
        }));
        return toStatusResult(msg);
    }
    async postImageStatus(media, options) {
        return this.postMediaStatus(media, options, 'image/jpeg');
    }
    async postVideoStatus(media, options) {
        return this.postMediaStatus(media, options, 'video/mp4');
    }
    async postVoiceStatus(media, options) {
        return this.postMediaStatus(media, options, 'audio/ogg; codecs=opus', { sendAudioAsVoice: true });
    }
    async postMediaStatus(media, options, fallbackType, extra) {
        this.host.ensureReady();
        this.warnStatusRecipientsOnce(options);
        const messageMedia = await (0, wwebjs_messaging_1.toMessageMedia)(media, this.host.config.proxy?.url, { fallbackType });
        const msg = await (0, wwebjs_host_1.reportPageDeath)(this.host, 'postMediaStatus', () => this.client().sendMessage('status@broadcast', messageMedia, {
            ...(options.caption !== undefined ? { caption: options.caption } : {}),
            ...extra,
        }));
        return toStatusResult(msg);
    }
    warnStatusRecipientsOnce(options) {
        if (this.warnedStatusRecipients || !options.recipients?.length)
            return;
        this.warnedStatusRecipients = true;
        this.host.logger.warn("postStatus on the whatsapp-web.js engine broadcasts to the account's status-privacy audience; " +
            'the recipients allow-list is not honored by whatsapp-web.js (it is on the Baileys engine).');
    }
    async deleteStatus(statusId) {
        this.host.ensureReady();
        try {
            await this.withPage('deleteStatus', () => this.client().revokeStatusMessage(statusId));
        }
        catch (error) {
            if (typeof error === 'string' && error.startsWith('Invalid usage!')) {
                throw new engine_refused_error_1.EngineRefusedError("Only the account's own statuses can be deleted");
            }
            throw error;
        }
    }
}
exports.WwebjsStatus = WwebjsStatus;
//# sourceMappingURL=wwebjs-status.js.map