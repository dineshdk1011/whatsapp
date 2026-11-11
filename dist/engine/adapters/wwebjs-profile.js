"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WwebjsProfile = void 0;
const engine_refused_error_1 = require("../../common/errors/engine-refused.error");
const wwebjs_messaging_1 = require("./wwebjs-messaging");
const wwebjs_host_1 = require("./wwebjs-host");
class WwebjsProfile {
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
    async createCallLink(type, startTime) {
        this.host.ensureReady();
        const link = await (0, wwebjs_host_1.reportPageDeath)(this.host, 'createCallLink', () => this.client().createCallLink(new Date(startTime), type === 'video' ? 'video' : 'voice'));
        if (!link) {
            throw new engine_refused_error_1.EngineRefusedError('WhatsApp did not return a call link');
        }
        return link;
    }
    async deleteProfilePicture() {
        this.host.ensureReady();
        const result = await this.withPage('deleteProfilePicture', () => this.client().deleteProfilePicture());
        if (result === false) {
            throw new engine_refused_error_1.EngineRefusedError('the engine rejected the profile picture removal');
        }
        this.host.logger.log('Deleted profile picture');
    }
    async setProfileName(name) {
        this.host.ensureReady();
        const ok = await this.withPage('setProfileName', () => this.client().setDisplayName(name));
        if (!ok) {
            throw new engine_refused_error_1.EngineRefusedError('the engine rejected the profile name change');
        }
        this.host.logger.log('Updated profile name');
    }
    async setProfileStatus(status) {
        this.host.ensureReady();
        await this.withPage('setProfileStatus', () => this.client().setStatus(status));
        this.host.logger.log('Updated profile status');
    }
    async setProfilePicture(media) {
        this.host.ensureReady();
        const messageMedia = await (0, wwebjs_messaging_1.toMessageMedia)(media, this.host.config.proxy?.url);
        const ok = await this.withPage('setProfilePicture', () => this.client().setProfilePicture(messageMedia));
        if (!ok) {
            throw new engine_refused_error_1.EngineRefusedError('the engine rejected the profile picture change');
        }
        this.host.logger.log('Updated profile picture');
    }
}
exports.WwebjsProfile = WwebjsProfile;
//# sourceMappingURL=wwebjs-profile.js.map