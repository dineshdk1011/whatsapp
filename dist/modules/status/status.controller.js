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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const status_response_dto_1 = require("./dto/status-response.dto");
const status_service_1 = require("./status.service");
const storage_transfer_1 = require("../../common/storage/storage-transfer");
const send_text_status_dto_1 = require("./dto/send-text-status.dto");
const send_media_status_dto_1 = require("./dto/send-media-status.dto");
const auth_decorators_1 = require("../auth/decorators/auth.decorators");
const api_key_entity_1 = require("../auth/entities/api-key.entity");
const engine_status_responses_1 = require("../../common/openapi/engine-status-responses");
let StatusController = class StatusController {
    statusService;
    constructor(statusService) {
        this.statusService = statusService;
    }
    async getStatuses(sessionId) {
        return { statuses: await this.statusService.getStatuses(sessionId) };
    }
    async getContactStatus(sessionId, contactId) {
        return { statuses: await this.statusService.getContactStatus(sessionId, contactId) };
    }
    async getStatusMedia(sessionId, statusId, res) {
        const { mimetype, ...source } = await this.statusService
            .getStatusMedia(sessionId, statusId)
            .catch((0, storage_transfer_1.retryAfterWhenBusy)(res));
        return (0, storage_transfer_1.storedFileAttachment)(res, source, mimetype);
    }
    async sendTextStatus(sessionId, dto) {
        return this.statusService.postTextStatus(sessionId, dto.text, {
            recipients: dto.recipients,
            backgroundColor: dto.backgroundColor,
            font: dto.font,
        });
    }
    async sendImageStatus(sessionId, dto) {
        return this.statusService.postImageStatus(sessionId, dto.image, {
            recipients: dto.recipients,
            caption: dto.caption,
        });
    }
    async sendVideoStatus(sessionId, dto) {
        return this.statusService.postVideoStatus(sessionId, dto.video, {
            recipients: dto.recipients,
            caption: dto.caption,
        });
    }
    async sendVoiceStatus(sessionId, dto) {
        return this.statusService.postVoiceStatus(sessionId, dto.audio, {
            recipients: dto.recipients,
            backgroundColor: dto.backgroundColor,
        });
    }
    async deleteStatus(sessionId, statusId) {
        await this.statusService.deleteStatus(sessionId, statusId);
        return { message: 'Status deleted successfully' };
    }
};
exports.StatusController = StatusController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all contact status updates' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Status updates visible to the session, newest first.',
        type: status_response_dto_1.StatusListResponseDto,
    }),
    __param(0, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StatusController.prototype, "getStatuses", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get status updates from a specific contact' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Contact ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Status updates from the requested contact.', type: status_response_dto_1.StatusListResponseDto }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], StatusController.prototype, "getContactStatus", null);
__decorate([
    (0, common_1.Get)(':statusId/media'),
    (0, swagger_1.ApiOperation)({ summary: 'Stream a stored status media file' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'The status image, video or voice note (audio) bytes.',
        content: { 'application/octet-stream': { schema: { type: 'string', format: 'binary' } } },
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'No stored media (text status, omitted, or expired).' }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'On S3 storage, the gateway already has 50 media downloads open across the status and chat media ' +
            'routes. Retry once the Retry-After header (1 second) has passed.',
    }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('statusId')),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], StatusController.prototype, "getStatusMedia", null);
__decorate([
    (0, common_1.Post)('send-text'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Post a text status' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Text status posted. The recipients allow-list is honored on Baileys only; whatsapp-web.js broadcasts ' +
            "to the account's status-privacy audience.",
        type: status_response_dto_1.StatusResultDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid request, or the post was blocked by a plugin.' }),
    (0, swagger_1.ApiResponse)({ status: 503, description: engine_status_responses_1.STATUS_POST_503 }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    (0, swagger_1.ApiResponse)({ status: 404, description: engine_status_responses_1.SESSION_NOT_STARTED_404 }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, send_text_status_dto_1.SendTextStatusDto]),
    __metadata("design:returntype", Promise)
], StatusController.prototype, "sendTextStatus", null);
__decorate([
    (0, common_1.Post)('send-image'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Post an image status' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Image status posted. The recipients allow-list is honored on Baileys only; whatsapp-web.js broadcasts ' +
            "to the account's status-privacy audience.",
        type: status_response_dto_1.StatusResultDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Neither url nor base64 provided, the url answers non-2xx, times out or cannot be reached, or the ' +
            'post was blocked by a plugin.',
    }),
    (0, swagger_1.ApiResponse)({ status: 413, description: engine_status_responses_1.MEDIA_TOO_LARGE_413 }),
    (0, swagger_1.ApiResponse)({ status: 503, description: `${engine_status_responses_1.MEDIA_URL_PROXY_503} ${engine_status_responses_1.STATUS_POST_503}` }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    (0, swagger_1.ApiResponse)({ status: 404, description: engine_status_responses_1.SESSION_NOT_STARTED_404 }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, send_media_status_dto_1.SendImageStatusDto]),
    __metadata("design:returntype", Promise)
], StatusController.prototype, "sendImageStatus", null);
__decorate([
    (0, common_1.Post)('send-video'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Post a video status' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Video status posted. The recipients allow-list is honored on Baileys only; whatsapp-web.js broadcasts ' +
            "to the account's status-privacy audience.",
        type: status_response_dto_1.StatusResultDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Neither url nor base64 provided, the url answers non-2xx, times out or cannot be reached, or the ' +
            'post was blocked by a plugin.',
    }),
    (0, swagger_1.ApiResponse)({ status: 413, description: engine_status_responses_1.MEDIA_TOO_LARGE_413 }),
    (0, swagger_1.ApiResponse)({ status: 503, description: `${engine_status_responses_1.MEDIA_URL_PROXY_503} ${engine_status_responses_1.STATUS_POST_503}` }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    (0, swagger_1.ApiResponse)({ status: 404, description: engine_status_responses_1.SESSION_NOT_STARTED_404 }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, send_media_status_dto_1.SendVideoStatusDto]),
    __metadata("design:returntype", Promise)
], StatusController.prototype, "sendVideoStatus", null);
__decorate([
    (0, common_1.Post)('send-voice'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Post an audio status as a voice note' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Voice status posted. WhatsApp plays a status voice note only as Ogg/Opus and neither engine ' +
            'transcodes, so convert first via POST /media/convert/voice. The recipients allow-list is honored ' +
            "on Baileys only; whatsapp-web.js broadcasts to the account's status-privacy audience.",
        type: status_response_dto_1.StatusResultDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Neither url nor base64 provided, the url answers non-2xx, times out or cannot be reached, or the ' +
            'post was blocked by a plugin.',
    }),
    (0, swagger_1.ApiResponse)({ status: 413, description: engine_status_responses_1.MEDIA_TOO_LARGE_413 }),
    (0, swagger_1.ApiResponse)({ status: 503, description: `${engine_status_responses_1.MEDIA_URL_PROXY_503} ${engine_status_responses_1.STATUS_POST_503}` }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    (0, swagger_1.ApiResponse)({ status: 404, description: engine_status_responses_1.SESSION_NOT_STARTED_404 }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, send_media_status_dto_1.SendVoiceStatusDto]),
    __metadata("design:returntype", Promise)
], StatusController.prototype, "sendVoiceStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Delete own status' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Status ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Status deleted.', type: status_response_dto_1.StatusDeletedResponseDto }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: "Key lacks OPERATOR role; on whatsapp-web.js, the id is not one of the account's own statuses; on " +
            'Baileys, the status was not posted by this session in the last 24 hours (it was posted from the phone ' +
            "or from another node, or before the session's engine was last created by a restart, a stop and start, " +
            'or a reconnect the gateway runs itself), so its recipients are unknown and the revoke cannot be ' +
            'addressed to them.',
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    (0, swagger_1.ApiResponse)({ status: 404, description: engine_status_responses_1.SESSION_NOT_STARTED_404 }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'The whatsapp-web.js page connection died mid-request, so the revoke did not complete. Safe ' +
            'to retry: revoking an already-revoked status converges. The status POST routes deliberately ' +
            'do NOT answer this for whatsapp-web.js, because a replayed post would publish the status a second ' +
            'time. On Baileys, also when WhatsApp rate-limits the revoke (code 429) or times out a query it ' +
            'awaits (code 408).',
    }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], StatusController.prototype, "deleteStatus", null);
exports.StatusController = StatusController = __decorate([
    (0, swagger_1.ApiTags)('status'),
    (0, common_1.Controller)('sessions/:sessionId/status'),
    __metadata("design:paramtypes", [status_service_1.StatusService])
], StatusController);
//# sourceMappingURL=status.controller.js.map