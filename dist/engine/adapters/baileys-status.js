"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaileysStatus = void 0;
const common_1 = require("@nestjs/common");
const baileys_messaging_1 = require("./baileys-messaging");
const baileys_audio_probe_1 = require("./baileys-audio-probe");
const engine_refused_error_1 = require("../../common/errors/engine-refused.error");
const engine_not_ready_error_1 = require("../../common/errors/engine-not-ready.error");
const baileys_query_deadline_1 = require("./baileys-query-deadline");
const STATUS_TTL_MS = 24 * 3_600_000;
class BaileysStatus {
    host;
    audiences = new Map();
    constructor(host) {
        this.host = host;
    }
    sock() {
        return this.host.getSocket();
    }
    async sendStatus(content, options) {
        const sock = this.sock();
        const deadline = this.host.sessionProxyUrl() ? { mediaUploadTimeoutMs: baileys_query_deadline_1.BAILEYS_QUERY_BUDGET_MS } : {};
        try {
            return await sock.sendMessage('status@broadcast', content, { ...options, ...deadline });
        }
        catch (error) {
            if (this.host.getSocketOrNull() !== sock)
                throw new engine_not_ready_error_1.EngineNotReadyError();
            throw (0, baileys_messaging_1.mapSendRefusal)(error);
        }
    }
    postTextStatus(text, options) {
        return this.postStatus({ text, linkPreview: null }, options);
    }
    postImageStatus(media, options) {
        return this.postMediaStatus('image', media, options);
    }
    postVideoStatus(media, options) {
        return this.postMediaStatus('video', media, options);
    }
    postVoiceStatus(media, options) {
        return this.postMediaStatus('voice', media, options);
    }
    async postMediaStatus(kind, media, options) {
        this.host.ensureReady();
        const fallbackType = kind === 'image' ? 'image/jpeg' : kind === 'video' ? 'video/mp4' : 'audio/ogg; codecs=opus';
        const { data, mimetype } = await (0, baileys_messaging_1.resolveMediaBuffer)(media, this.host.sessionProxyUrl(), fallbackType);
        const content = kind === 'image'
            ? { image: data, caption: options.caption, mimetype }
            : kind === 'video'
                ? { video: data, caption: options.caption, mimetype }
                : { audio: data, mimetype, ptt: true, ...(await (0, baileys_audio_probe_1.describeAudio)(data, true)) };
        return this.postStatus(content, options);
    }
    async deleteStatus(statusId) {
        this.host.ensureReady();
        const audience = this.audiences.get(statusId);
        if (!audience || audience.expiresAt <= Date.now()) {
            throw new engine_refused_error_1.EngineRefusedError(`status ${statusId} was not posted by this session in the last 24 hours, so its recipients are ` +
                'unknown and the revoke cannot be addressed to them');
        }
        const sent = await this.sendStatus({
            delete: {
                remoteJid: 'status@broadcast',
                fromMe: true,
                id: statusId,
                participant: this.host.toEngineJid(this.host.normalizedSelfJid()),
            },
        }, { statusJidList: audience.jids });
        this.host.rememberOwnSend(sent?.key?.id);
    }
    async postStatus(content, options) {
        this.host.ensureReady();
        if (!options.recipients?.length) {
            throw new common_1.BadRequestException('recipients is required to post a status on the Baileys engine');
        }
        const statusJidList = options.recipients.map(r => this.host.toEngineJid(r));
        const sent = await this.sendStatus(content, {
            statusJidList,
            backgroundColor: options.backgroundColor,
            font: options.font,
        });
        this.host.rememberOwnSend(sent?.key?.id);
        const now = Date.now();
        for (const [id, audience] of this.audiences) {
            if (audience.expiresAt > now)
                break;
            this.audiences.delete(id);
        }
        if (sent?.key?.id)
            this.audiences.set(sent.key.id, { jids: statusJidList, expiresAt: now + STATUS_TTL_MS });
        return this.toStatusResult(sent);
    }
    toStatusResult(sent) {
        const ts = sent?.messageTimestamp ? new Date(this.host.toUnixSeconds(sent.messageTimestamp) * 1000) : new Date();
        return {
            statusId: sent?.key?.id ?? '',
            timestamp: ts,
            expiresAt: new Date(ts.getTime() + STATUS_TTL_MS),
        };
    }
}
exports.BaileysStatus = BaileysStatus;
//# sourceMappingURL=baileys-status.js.map