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
exports.ProfileController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const profile_response_dto_1 = require("./dto/profile-response.dto");
const profile_service_1 = require("./profile.service");
const profile_dto_1 = require("./dto/profile.dto");
const auth_decorators_1 = require("../auth/decorators/auth.decorators");
const api_key_entity_1 = require("../auth/entities/api-key.entity");
const engine_status_responses_1 = require("../../common/openapi/engine-status-responses");
let ProfileController = class ProfileController {
    profileService;
    constructor(profileService) {
        this.profileService = profileService;
    }
    async setName(sessionId, dto) {
        await this.profileService.setProfileName(sessionId, dto.name);
        return { success: true, message: 'Profile name updated' };
    }
    async setStatus(sessionId, dto) {
        await this.profileService.setProfileStatus(sessionId, dto.status);
        return { success: true, message: 'Profile status updated' };
    }
    async setPicture(sessionId, dto) {
        await this.profileService.setProfilePicture(sessionId, dto);
        return { success: true, message: 'Profile picture updated' };
    }
    async deletePicture(sessionId) {
        await this.profileService.deleteProfilePicture(sessionId);
        return { success: true, message: 'Profile picture removed' };
    }
};
exports.ProfileController = ProfileController;
__decorate([
    (0, common_1.Put)('name'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Set the account display name' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiBody)({ type: profile_dto_1.SetProfileNameDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Profile name updated', type: profile_response_dto_1.ProfileAckResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Session is not started' }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'The whatsapp-web.js engine refused the name change. The Baileys engine has no acceptance ' +
            'signal and answers 200 for a rename WhatsApp declined.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'WhatsApp did not answer within the request budget. The change may or may not have been applied — ' +
            'the gateway stopped waiting for a confirmation that never came.',
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, profile_dto_1.SetProfileNameDto]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "setName", null);
__decorate([
    (0, common_1.Put)('status'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Set the account about/status text' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiBody)({ type: profile_dto_1.SetProfileStatusDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Profile status updated', type: profile_response_dto_1.ProfileAckResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Session is not started' }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'WhatsApp did not answer within the request budget. The change may or may not have been applied — ' +
            'the gateway stopped waiting for a confirmation that never came.',
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, profile_dto_1.SetProfileStatusDto]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "setStatus", null);
__decorate([
    (0, common_1.Put)('picture'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Set the account profile picture (URL or base64 image)' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiBody)({ type: profile_dto_1.SetProfilePictureDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Profile picture updated', type: profile_response_dto_1.ProfileAckResponseDto }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Neither url nor base64 provided, base64 without mimetype, session is not started, the url ' +
            'answers non-2xx, times out or cannot be reached, or the image cannot be read (Baileys refuses an SVG)',
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'The whatsapp-web.js engine refused the picture change. The Baileys engine has no acceptance ' +
            'signal and answers 200 for an upload WhatsApp declined.',
    }),
    (0, swagger_1.ApiResponse)({ status: 413, description: engine_status_responses_1.MEDIA_TOO_LARGE_413 }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'WhatsApp did not answer within the request budget. The change may or may not have been applied — ' +
            'the gateway stopped waiting for a confirmation that never came. ' +
            engine_status_responses_1.MEDIA_URL_PROXY_503,
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, profile_dto_1.SetProfilePictureDto]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "setPicture", null);
__decorate([
    (0, common_1.Delete)('picture'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: "Remove the account's profile picture" }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Profile picture removed', type: profile_response_dto_1.ProfileAckResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Session is not started' }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'The whatsapp-web.js engine refused the picture removal. The Baileys engine has no acceptance ' +
            'signal and answers 200 for a removal WhatsApp declined.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'WhatsApp did not answer within the request budget. The change may or may not have been applied — ' +
            'the gateway stopped waiting for a confirmation that never came.',
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    __param(0, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "deletePicture", null);
exports.ProfileController = ProfileController = __decorate([
    (0, swagger_1.ApiTags)('profile'),
    (0, common_1.Controller)('sessions/:sessionId/profile'),
    __metadata("design:paramtypes", [profile_service_1.ProfileService])
], ProfileController);
//# sourceMappingURL=profile.controller.js.map