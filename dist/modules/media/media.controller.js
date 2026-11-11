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
exports.MediaController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const media_response_dto_1 = require("./dto/media-response.dto");
const media_conversion_service_1 = require("./media-conversion.service");
const convert_media_dto_1 = require("./dto/convert-media.dto");
const auth_decorators_1 = require("../auth/decorators/auth.decorators");
const api_key_entity_1 = require("../auth/entities/api-key.entity");
const engine_status_responses_1 = require("../../common/openapi/engine-status-responses");
let MediaController = class MediaController {
    mediaConversion;
    constructor(mediaConversion) {
        this.mediaConversion = mediaConversion;
    }
    async conversionStatus() {
        return { available: await this.mediaConversion.isAvailable() };
    }
    async convertVoice(sessionId, dto) {
        return this.mediaConversion.convertToVoice(sessionId, dto);
    }
    async convertVideo(sessionId, dto) {
        return this.mediaConversion.convertToVideo(sessionId, dto);
    }
};
exports.MediaController = MediaController;
__decorate([
    (0, common_1.Get)('convert'),
    (0, swagger_1.ApiOperation)({ summary: 'Whether server-side media conversion is available' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Reports whether conversion is switched on AND the ffmpeg binary can be run, so a client can ' +
            'decide between converting here and converting before it sends.',
        type: media_response_dto_1.ConversionStatusResponseDto,
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "conversionStatus", null);
__decorate([
    (0, common_1.Post)('convert/voice'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Convert audio into a WhatsApp voice note (Ogg/Opus)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Converted bytes, ready to post to send-audio with ptt=true. WhatsApp only renders a playable ' +
            'mic bubble for Ogg/Opus; other formats arrive as an audio file that will not play.',
        type: media_response_dto_1.ConvertedMediaResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Neither url nor base64 given, the url is not an absolute http(s) URL or answers non-2xx, times out or ' +
            'cannot be reached, or ffmpeg refused the input.',
    }),
    (0, swagger_1.ApiResponse)({ status: 413, description: 'The supplied media is above the media size cap.' }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'Conversion is disabled, the ffmpeg binary is not runnable, or the conversion queue is saturated — retry shortly. ' +
            'It also answers 503 once the gateway is shutting down. ' +
            engine_status_responses_1.MEDIA_URL_PROXY_503,
    }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, convert_media_dto_1.ConvertMediaDto]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "convertVoice", null);
__decorate([
    (0, common_1.Post)('convert/video'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Convert video into a WhatsApp-compatible MP4' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Converted bytes: baseline H.264 with AAC audio, fitted inside 1280x720 (720x1280 portrait), index ' +
            'moved to the front so the recipient can start playing before the whole file arrives.',
        type: media_response_dto_1.ConvertedMediaResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Neither url nor base64 given, the url is not an absolute http(s) URL or answers non-2xx, times out or ' +
            'cannot be reached, or ffmpeg refused the input.',
    }),
    (0, swagger_1.ApiResponse)({ status: 413, description: 'The supplied media is above the media size cap.' }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'Conversion is disabled, the ffmpeg binary is not runnable, or the conversion queue is saturated — retry shortly. ' +
            'It also answers 503 once the gateway is shutting down. ' +
            engine_status_responses_1.MEDIA_URL_PROXY_503,
    }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, convert_media_dto_1.ConvertMediaDto]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "convertVideo", null);
exports.MediaController = MediaController = __decorate([
    (0, swagger_1.ApiTags)('media'),
    (0, swagger_1.ApiParam)({ name: 'sessionId', type: String, description: 'Session ID the API key must be authorized for' }),
    (0, common_1.Controller)('sessions/:sessionId/media'),
    __metadata("design:paramtypes", [media_conversion_service_1.MediaConversionService])
], MediaController);
//# sourceMappingURL=media.controller.js.map