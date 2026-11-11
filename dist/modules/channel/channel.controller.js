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
exports.ChannelController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const channel_response_dto_1 = require("./dto/channel-response.dto");
const channel_service_1 = require("./channel.service");
const subscribe_channel_dto_1 = require("./dto/subscribe-channel.dto");
const create_channel_dto_1 = require("./dto/create-channel.dto");
const mute_channel_dto_1 = require("./dto/mute-channel.dto");
const demote_channel_admin_dto_1 = require("./dto/demote-channel-admin.dto");
const transfer_channel_ownership_dto_1 = require("./dto/transfer-channel-ownership.dto");
const auth_decorators_1 = require("../auth/decorators/auth.decorators");
const api_key_entity_1 = require("../auth/entities/api-key.entity");
const engine_status_responses_1 = require("../../common/openapi/engine-status-responses");
const CHANNEL_ID_INVALID_404 = 'The id is not a channel id (it does not end in `@newsletter`). Retrying the same id cannot succeed.';
const THROTTLED_503 = ' On Baileys, also answered when WhatsApp rate-limits or times out the request (code 429 or 408); ' +
    'retry after a pause.';
let ChannelController = class ChannelController {
    channelService;
    constructor(channelService) {
        this.channelService = channelService;
    }
    async findAll(sessionId) {
        return this.channelService.getSubscribedChannels(sessionId);
    }
    async findOne(sessionId, channelId) {
        return this.channelService.getChannelById(sessionId, channelId);
    }
    async getMessages(sessionId, channelId, limit) {
        const parsed = limit !== undefined ? parseInt(limit, 10) : NaN;
        return this.channelService.getChannelMessages(sessionId, channelId, Number.isNaN(parsed) ? undefined : parsed);
    }
    async create(sessionId, dto) {
        return this.channelService.createChannel(sessionId, dto.name, dto.description);
    }
    async remove(sessionId, channelId) {
        await this.channelService.deleteChannel(sessionId, channelId);
        return { success: true };
    }
    async mute(sessionId, channelId, dto) {
        await this.channelService.muteChannel(sessionId, channelId, dto.mute);
        return { success: true };
    }
    async demoteAdmin(sessionId, channelId, dto) {
        await this.channelService.demoteChannelAdmin(sessionId, channelId, dto.userId);
        return { success: true };
    }
    async transferOwnership(sessionId, channelId, dto) {
        await this.channelService.transferChannelOwnership(sessionId, channelId, dto.newOwnerId);
        return { success: true };
    }
    async subscribe(sessionId, body) {
        return this.channelService.subscribeToChannel(sessionId, body.inviteCode);
    }
    async unsubscribe(sessionId, channelId) {
        await this.channelService.unsubscribeFromChannel(sessionId, channelId);
        return { success: true };
    }
};
exports.ChannelController = ChannelController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all subscribed channels/newsletters' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of subscribed channels', type: [channel_response_dto_1.ChannelDto] }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Session not started' }),
    (0, swagger_1.ApiResponse)({
        status: 501,
        description: 'Not supported by the active engine: the Baileys adapter cannot list subscribed channels.',
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    __param(0, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':channelId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a specific channel by ID' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiParam)({ name: 'channelId', description: 'Channel ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Channel details. The Baileys engine reads `createdAt` off the newsletter metadata and the ' +
            'whatsapp-web.js engine never fills it. Neither engine fills `picture`: WhatsApp reports only a media path.',
        type: channel_response_dto_1.ChannelDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'WhatsApp did not answer within the request budget — nothing could be read.' + THROTTLED_503,
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Channel not found. On the whatsapp-web.js engine this also covers a channel that exists but ' +
            'the account does not follow, because the lookup scans the subscribed-channel list; the Baileys ' +
            'engine resolves any channel by id.',
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Session not started' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('channelId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':channelId/messages'),
    (0, swagger_1.ApiOperation)({ summary: 'Get messages from a channel' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiParam)({ name: 'channelId', description: 'Channel ID' }),
    (0, swagger_1.ApiQuery)({
        name: 'limit',
        required: false,
        type: 'integer',
        description: 'Max messages to return (default 50, max 100)',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of channel messages', type: [channel_response_dto_1.ChannelMessageDto] }),
    (0, swagger_1.ApiResponse)({
        status: 501,
        description: 'Not supported by the active engine: the Baileys adapter cannot read channel messages.',
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Session not started' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    (0, swagger_1.ApiResponse)({ status: 404, description: engine_status_responses_1.CHANNEL_NOT_FOUND_404 }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('channelId')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "getMessages", null);
__decorate([
    (0, common_1.Post)(),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({
        summary: 'Create a channel',
        description: 'The account becomes the channel owner, which is what makes deleting it possible later — ' +
            'neither engine can delete a channel it does not own.',
    }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiBody)({ type: create_channel_dto_1.CreateChannelDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'The created channel', type: channel_response_dto_1.ChannelDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Session not started, or validation failed' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'The engine refused — channel creation may be disabled for this account' }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'WhatsApp rate-limited the create (code 429, Baileys); nothing was created, so retrying after a pause is ' +
            'safe. A timed-out create is not answered 503, because the channel may have been created.',
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_channel_dto_1.CreateChannelDto]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':channelId/delete'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Delete a channel this account owns',
        description: 'Irreversible, and every subscriber loses the channel. Deliberately NOT `DELETE ' +
            '/channels/:channelId` — that route unsubscribes, and the two must not be reachable by the ' +
            'same request with a slip of the wrist. Only the owner can delete.',
    }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiParam)({ name: 'channelId', description: 'Channel ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Channel deleted', type: channel_response_dto_1.ChannelAckResponseDto }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'WhatsApp did not answer within the request budget — the operation may or may not have applied.' + THROTTLED_503,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Session not started' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'The engine refused — not found, or this account does not own it' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    (0, swagger_1.ApiResponse)({ status: 404, description: CHANNEL_ID_INVALID_404 }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('channelId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':channelId/mute'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Mute or unmute a channel',
        description: "Silences the channel's notifications for this account. The subscription is untouched.",
    }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiParam)({ name: 'channelId', description: 'Channel ID' }),
    (0, swagger_1.ApiBody)({ type: mute_channel_dto_1.MuteChannelDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Channel muted or unmuted', type: channel_response_dto_1.ChannelAckResponseDto }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'WhatsApp did not answer within the request budget — the operation may or may not have applied.' + THROTTLED_503,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Session not started, or validation failed' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'The engine refused' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: CHANNEL_ID_INVALID_404 +
            " On whatsapp-web.js, also answered for a channel id that is not among the session's subscribed channels" +
            ' or has not synced into the local collection yet.',
    }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('channelId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, mute_channel_dto_1.MuteChannelDto]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "mute", null);
__decorate([
    (0, common_1.Post)(':channelId/admins/demote'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Demote a channel admin back to a subscriber',
        description: 'Requires this account to own the channel. There is no promote counterpart: neither engine ' +
            'library exposes one, so an admin is promoted from the WhatsApp app and demoted here.',
    }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiParam)({ name: 'channelId', description: 'Channel ID' }),
    (0, swagger_1.ApiBody)({ type: demote_channel_admin_dto_1.DemoteChannelAdminDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Admin demoted', type: channel_response_dto_1.ChannelAckResponseDto }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'WhatsApp did not answer within the request budget — the operation may or may not have applied.' + THROTTLED_503,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Session not started, or validation failed' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'The engine refused — not the owner, or the user is not an admin' }),
    (0, swagger_1.ApiResponse)({
        status: 501,
        description: 'The whatsapp-web.js engine cannot perform this: the WhatsApp Web module its library method ' +
            'targets no longer exports the function. Use the Baileys engine.',
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('channelId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, demote_channel_admin_dto_1.DemoteChannelAdminDto]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "demoteAdmin", null);
__decorate([
    (0, common_1.Post)(':channelId/owner/transfer'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Transfer channel ownership to another account',
        description: 'IRREVERSIBLE. Once the transfer lands, this session is no longer the owner and cannot take ' +
            'the channel back through this API. Requires this account to currently own the channel. The ' +
            'upstream option to also dismiss yourself as an admin in the same call is not exposed, ' +
            'because the WhatsApp Web function it depends on no longer exists and the branch swallows ' +
            'its own errors, so it would fail silently.',
    }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiParam)({ name: 'channelId', description: 'Channel ID' }),
    (0, swagger_1.ApiBody)({ type: transfer_channel_ownership_dto_1.TransferChannelOwnershipDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Ownership transferred', type: channel_response_dto_1.ChannelAckResponseDto }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'WhatsApp did not answer within the request budget — the transfer may or may not have applied.' + THROTTLED_503,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Session not started, or validation failed' }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'The engine did not transfer the channel. On whatsapp-web.js this is the only outcome a ' +
            'failure can produce: the page swallows every error into a plain false, so the cause is not ' +
            'reported.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 501,
        description: 'The whatsapp-web.js engine cannot perform this: its page function rejects every call locally ' +
            'against a subscriber list the page cannot repopulate. Use the Baileys engine.',
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('channelId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, transfer_channel_ownership_dto_1.TransferChannelOwnershipDto]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "transferOwnership", null);
__decorate([
    (0, common_1.Post)('subscribe'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Subscribe to a channel using invite code' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                inviteCode: {
                    type: 'string',
                    description: 'Channel invite code (from channel link)',
                    example: 'ABC123xyz',
                },
            },
            required: ['inviteCode'],
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Successfully subscribed to channel', type: channel_response_dto_1.ChannelDto }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'WhatsApp did not answer within the request budget — the operation may or may not have applied.' + THROTTLED_503,
    }),
    (0, swagger_1.ApiResponse)({
        status: 501,
        description: 'Not supported by the active engine: whatsapp-web.js cannot subscribe by invite code.',
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Session not started, or validation failed' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    (0, swagger_1.ApiResponse)({ status: 404, description: engine_status_responses_1.CHANNEL_INVITE_NOT_FOUND_404 }),
    (0, swagger_1.ApiResponse)({ status: 403, description: engine_status_responses_1.ENGINE_REFUSED_403 }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, subscribe_channel_dto_1.SubscribeChannelDto]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "subscribe", null);
__decorate([
    (0, common_1.Delete)(':channelId'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Unsubscribe from a channel' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiParam)({ name: 'channelId', description: 'Channel ID to unsubscribe from' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Successfully unsubscribed from channel', type: channel_response_dto_1.ChannelAckResponseDto }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'WhatsApp did not answer within the request budget — the operation may or may not have applied.' + THROTTLED_503,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Session not started' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    (0, swagger_1.ApiResponse)({ status: 403, description: engine_status_responses_1.ENGINE_REFUSED_403 }),
    (0, swagger_1.ApiResponse)({ status: 404, description: CHANNEL_ID_INVALID_404 }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('channelId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "unsubscribe", null);
exports.ChannelController = ChannelController = __decorate([
    (0, swagger_1.ApiTags)('channels'),
    (0, common_1.Controller)('sessions/:sessionId/channels'),
    __metadata("design:paramtypes", [channel_service_1.ChannelService])
], ChannelController);
//# sourceMappingURL=channel.controller.js.map