"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusService = void 0;
const common_1 = require("@nestjs/common");
const engine_registry_service_1 = require("../../engine/engine-registry.service");
const status_store_service_1 = require("../status-store/status-store.service");
const storage_service_1 = require("../../common/storage/storage.service");
const media_cap_util_1 = require("../message/media-cap.util");
const hooks_1 = require("../../core/hooks");
const send_pacing_service_1 = require("../message/send-pacing.service");
const media_url_1 = require("../../common/media/media-url");
const logger_service_1 = require("../../common/services/logger.service");
const SAFE_STATUS_MIMETYPE = /^(image|video|audio)\/[a-z0-9][a-z0-9.+-]*$/;
const BASE64_TEXT = /^[A-Za-z0-9+/_\-\s]*(?:=+\s*)?$/;
let StatusService = class StatusService {
    engines;
    hookManager;
    store;
    storageService;
    pacing;
    logger = (0, logger_service_1.createLogger)('StatusService');
    constructor(engines, hookManager, store, storageService, pacing) {
        this.engines = engines;
        this.hookManager = hookManager;
        this.store = store;
        this.storageService = storageService;
        this.pacing = pacing;
    }
    async gate(sessionId, type, input) {
        await this.pacing.assertSendAllowed(sessionId);
        return (0, hooks_1.applySendingGate)(this.hookManager, sessionId, type, input, 'StatusService');
    }
    guardGatedMedia(media) {
        const data = (0, media_cap_util_1.stripBase64DataUri)(media.data) ?? media.data;
        if (!(0, media_url_1.isMediaUrl)(data) && !BASE64_TEXT.test(data)) {
            throw new common_1.BadRequestException('media must be an absolute http(s) URL or base64');
        }
        (0, media_cap_util_1.assertBase64WithinMediaCap)(data);
        return { mimetype: media.mimetype, data };
    }
    async getStatuses(sessionId) {
        return this.store.list(sessionId);
    }
    async getContactStatus(sessionId, contactId) {
        return this.store.listByContact(sessionId, contactId);
    }
    async getStatusMedia(sessionId, statusId) {
        const media = await this.store.getMedia(sessionId, statusId);
        if (!media) {
            throw new common_1.NotFoundException('Status media not found or expired');
        }
        try {
            const { stream, size } = await this.storageService.openFile(media.path);
            const essence = media.mimetype.split(';')[0].trim().toLowerCase();
            const mimetype = SAFE_STATUS_MIMETYPE.test(essence) && essence !== 'image/svg+xml' ? essence : 'application/octet-stream';
            return { stream, size, mimetype };
        }
        catch (error) {
            if ((0, storage_service_1.isMissingObjectError)(error)) {
                throw new common_1.NotFoundException('Status media not found or expired');
            }
            throw error;
        }
    }
    async recordedPost(sessionId, kind, post) {
        try {
            const result = await post();
            this.pacing.recordSendSuccess(sessionId);
            return result;
        }
        catch (error) {
            if ((0, send_pacing_service_1.countsTowardSendBreaker)(error)) {
                this.pacing.recordSendFailure(sessionId);
                this.logger.warn(`Status post failed in the engine (${kind})`, {
                    sessionId,
                    error: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
                    ...(error instanceof Error && error.cause instanceof Error ? { cause: error.cause.message } : {}),
                });
            }
            throw error;
        }
    }
    async postTextStatus(sessionId, text, options) {
        const engine = this.engines.require(sessionId, () => new common_1.NotFoundException(`Session ${sessionId} not found or not connected`));
        const gated = await this.gate(sessionId, 'status-text', { text, options });
        return this.recordedPost(sessionId, 'text', () => engine.postTextStatus(gated.text, gated.options));
    }
    async postImageStatus(sessionId, media, options) {
        const payload = (0, media_cap_util_1.resolveMediaBody)(media, { fallbackMimetype: 'image/jpeg' });
        const engine = this.engines.require(sessionId, () => new common_1.NotFoundException(`Session ${sessionId} not found or not connected`));
        const gated = await this.gate(sessionId, 'status-image', { media: payload, options });
        return this.recordedPost(sessionId, 'image', () => engine.postImageStatus(this.guardGatedMedia(gated.media), gated.options));
    }
    async postVideoStatus(sessionId, media, options) {
        const payload = (0, media_cap_util_1.resolveMediaBody)(media, { fallbackMimetype: 'video/mp4' });
        const engine = this.engines.require(sessionId, () => new common_1.NotFoundException(`Session ${sessionId} not found or not connected`));
        const gated = await this.gate(sessionId, 'status-video', { media: payload, options });
        return this.recordedPost(sessionId, 'video', () => engine.postVideoStatus(this.guardGatedMedia(gated.media), gated.options));
    }
    async postVoiceStatus(sessionId, media, options) {
        const payload = (0, media_cap_util_1.resolveMediaBody)(media, { fallbackMimetype: 'audio/ogg; codecs=opus' });
        const engine = this.engines.require(sessionId, () => new common_1.NotFoundException(`Session ${sessionId} not found or not connected`));
        const gated = await this.gate(sessionId, 'status-voice', { media: payload, options });
        return this.recordedPost(sessionId, 'voice', () => engine.postVoiceStatus(this.guardGatedMedia(gated.media), gated.options));
    }
    async deleteStatus(sessionId, statusId) {
        const engine = this.engines.require(sessionId, () => new common_1.NotFoundException(`Session ${sessionId} not found or not connected`));
        return engine.deleteStatus(statusId);
    }
};
exports.StatusService = StatusService;
exports.StatusService = StatusService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [engine_registry_service_1.EngineRegistry,
        hooks_1.HookManager,
        status_store_service_1.StatusStoreService,
        storage_service_1.StorageService,
        send_pacing_service_1.SendPacingService])
], StatusService);
//# sourceMappingURL=status.service.js.map