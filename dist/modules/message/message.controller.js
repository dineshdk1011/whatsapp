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
exports.MessageController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const storage_transfer_1 = require("../../common/storage/storage-transfer");
const message_service_1 = require("./message.service");
const bulk_message_service_1 = require("./bulk-message.service");
const dto_1 = require("./dto");
const send_template_dto_1 = require("./dto/send-template.dto");
const bulk_message_dto_1 = require("./dto/bulk-message.dto");
const message_responses_dto_1 = require("./dto/message-responses.dto");
const message_actions_dto_1 = require("./dto/message-actions.dto");
const auth_decorators_1 = require("../auth/decorators/auth.decorators");
const api_key_entity_1 = require("../auth/entities/api-key.entity");
const chat_scope_service_1 = require("../auth/chat-scope.service");
const message_window_1 = require("./message-window");
const engine_status_responses_1 = require("../../common/openapi/engine-status-responses");
const idempotent_send_decorator_1 = require("./idempotency/idempotent-send.decorator");
const CHANNEL_OR_BROADCAST = 'a channel (`<id>@newsletter`) or a status or broadcast list (`@broadcast`)';
const QUOTED_SEND_501 = `whatsapp-web.js also refuses a send with \`quotedMessageId\` to ${CHANNEL_OR_BROADCAST}; nothing is sent.`;
const wwebjsRefuses501 = (what) => `whatsapp-web.js cannot send ${what}; nothing is sent.`;
let MessageController = class MessageController {
    messageService;
    bulkMessageService;
    chatScope;
    constructor(messageService, bulkMessageService, chatScope) {
        this.messageService = messageService;
        this.bulkMessageService = bulkMessageService;
        this.chatScope = chatScope;
    }
    async getMessages(sessionId, chatId, from, limit, offset, after, inlineMedia, apiKey, since, until, direction, orderBy, type, messageId) {
        this.chatScope.requireChat(apiKey, chatId);
        return this.messageService.getMessages(sessionId, {
            ...(0, message_window_1.parseMessageWindow)({ since, until, direction, orderBy, type, messageId }),
            chatId,
            from,
            limit: limit ? parseInt(limit, 10) : undefined,
            offset: offset ? parseInt(offset, 10) : undefined,
            after: after?.trim() || undefined,
            inlineMedia: inlineMedia !== 'false' && inlineMedia !== '0',
        });
    }
    async sendText(sessionId, dto) {
        return this.messageService.sendText(sessionId, dto);
    }
    async sendTemplate(sessionId, dto) {
        return this.messageService.sendTemplate(sessionId, dto);
    }
    async sendImage(sessionId, dto) {
        return this.messageService.sendImage(sessionId, dto);
    }
    async sendVideo(sessionId, dto) {
        return this.messageService.sendVideo(sessionId, dto);
    }
    async sendAudio(sessionId, dto) {
        return this.messageService.sendAudio(sessionId, dto);
    }
    async sendDocument(sessionId, dto) {
        return this.messageService.sendDocument(sessionId, dto);
    }
    async sendLocation(sessionId, dto) {
        return this.messageService.sendLocation(sessionId, dto);
    }
    async sendContact(sessionId, dto) {
        return this.messageService.sendContact(sessionId, dto);
    }
    async sendSticker(sessionId, dto) {
        return this.messageService.sendSticker(sessionId, dto);
    }
    async sendPoll(sessionId, dto) {
        return this.messageService.sendPoll(sessionId, dto);
    }
    async reply(sessionId, dto) {
        return this.messageService.reply(sessionId, dto);
    }
    async clickButton(sessionId, dto) {
        return this.messageService.clickButton(sessionId, dto);
    }
    async forward(sessionId, dto) {
        return this.messageService.forward(sessionId, dto);
    }
    async react(sessionId, dto) {
        await this.messageService.reactToMessage(sessionId, dto);
        return { success: true };
    }
    async getBatchStatus(sessionId, batchId) {
        const batch = await this.bulkMessageService.getBatchStatus(sessionId, batchId);
        return {
            batchId: batch.batchId,
            status: batch.status,
            progress: batch.progress,
            results: batch.results,
            startedAt: batch.startedAt,
            completedAt: batch.completedAt,
        };
    }
    async cancelBatch(sessionId, batchId) {
        const batch = await this.bulkMessageService.cancelBatch(sessionId, batchId);
        return {
            batchId: batch.batchId,
            status: batch.status,
            progress: batch.progress,
        };
    }
    async getChatHistory(sessionId, chatId, limit, includeMedia, deep, res) {
        const parsedLimit = limit ? parseInt(limit, 10) : undefined;
        const abort = new AbortController();
        res?.on('close', () => abort.abort());
        return this.messageService.getChatHistory(sessionId, chatId, parsedLimit !== undefined && !Number.isNaN(parsedLimit) ? parsedLimit : undefined, includeMedia === 'true' || includeMedia === '1', deep === 'true' || deep === '1', abort.signal);
    }
    async getReactions(sessionId, chatId, messageId) {
        return this.messageService.getMessageReactions(sessionId, chatId, messageId);
    }
    async getChatMedia(sessionId, chatId, messageId, res) {
        const { mimetype, ...source } = await this.messageService
            .getChatMedia(sessionId, chatId, messageId)
            .catch((0, storage_transfer_1.retryAfterWhenBusy)(res));
        return (0, storage_transfer_1.storedFileAttachment)(res, source, mimetype);
    }
    async deleteMessage(sessionId, dto) {
        await this.messageService.deleteMessage(sessionId, dto);
        return { success: true };
    }
    async votePoll(sessionId, dto) {
        return this.messageService.votePoll(sessionId, dto);
    }
    async pinMessage(sessionId, dto) {
        return this.messageService.pinMessage(sessionId, dto);
    }
    async unpinMessage(sessionId, dto) {
        return this.messageService.unpinMessage(sessionId, dto);
    }
    async starMessage(sessionId, dto) {
        return this.messageService.starMessage(sessionId, dto);
    }
    async edit(sessionId, dto) {
        return this.messageService.editMessage(sessionId, dto);
    }
    async sendBulk(sessionId, dto) {
        const batch = await this.bulkMessageService.createBatch(sessionId, dto);
        const estimatedTime = new Date(Date.now() + batch.messages.length * (batch.options?.delayBetweenMessages || 3000));
        return {
            batchId: batch.batchId,
            status: batch.status,
            totalMessages: batch.messages.length,
            estimatedCompletionTime: estimatedTime.toISOString(),
            statusUrl: `/api/sessions/${encodeURIComponent(sessionId)}/messages/batch/${encodeURIComponent(batch.batchId)}`,
        };
    }
};
exports.MessageController = MessageController;
__decorate([
    (0, swagger_1.ApiQuery)({
        name: 'messageId',
        required: false,
        description: 'Exact WhatsApp message reference; remains scoped to the session and chat.',
    }),
    (0, auth_decorators_1.ChatScoped)('fenced'),
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get message history for a session' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiQuery)({
        name: 'chatId',
        required: false,
        description: 'Filter by chat ID. Required for an API key restricted to selected chats.',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'from',
        required: false,
        description: 'Filter by sender. A phone also matches group messages via the author field and any lid that resolves to it.',
    }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: 'integer', description: 'Max messages to return (default 50)' }),
    (0, swagger_1.ApiQuery)({ name: 'offset', required: false, type: 'integer', description: 'Offset for pagination' }),
    (0, swagger_1.ApiQuery)({
        name: 'inlineMedia',
        required: false,
        type: Boolean,
        description: "Set false to omit inline media payloads, leaving each row's { omitted, sizeBytes } marker and " +
            'the media endpoint. The inline-media budget is per response, so a paged walk pulls it afresh on ' +
            'every page; default true.',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'after',
        required: false,
        description: 'Keyset cursor: the id of the last message of the previous page. Anchors the window to a row ' +
            'rather than a count, so a message arriving mid-walk cannot shift it. Takes precedence over offset.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Message history',
        type: message_responses_dto_1.MessageListResponseDto,
    }),
    (0, swagger_1.ApiQuery)({
        name: 'since',
        required: false,
        type: Number,
        description: 'Inclusive message-time lower bound, Unix epoch milliseconds (not ingestion time).',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'until',
        required: false,
        type: Number,
        description: 'Exclusive message-time upper bound, Unix epoch milliseconds.',
    }),
    (0, swagger_1.ApiQuery)({ name: 'direction', required: false, enum: ['incoming', 'outgoing'] }),
    (0, swagger_1.ApiQuery)({
        name: 'type',
        required: false,
        type: String,
        description: 'Exact stored message type token, e.g. text, image, voice.',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'orderBy',
        required: false,
        enum: ['createdAt', 'timestamp'],
        description: 'Newest first. Default createdAt preserves existing ordering; timestamp uses message time and excludes rows without a known timestamp.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Invalid message filters or an unknown cursor. With time, direction, type or message-reference filters, ' +
            'the cursor must belong to the same selection.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'The API key is restricted to selected chats and either sent no `chatId` or named a chat outside ' +
            'its allowlist.',
    }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Query)('chatId')),
    __param(2, (0, common_1.Query)('from')),
    __param(3, (0, common_1.Query)('limit')),
    __param(4, (0, common_1.Query)('offset')),
    __param(5, (0, common_1.Query)('after')),
    __param(6, (0, common_1.Query)('inlineMedia')),
    __param(7, (0, auth_decorators_1.CurrentApiKey)()),
    __param(8, (0, common_1.Query)('since')),
    __param(9, (0, common_1.Query)('until')),
    __param(10, (0, common_1.Query)('direction')),
    __param(11, (0, common_1.Query)('orderBy')),
    __param(12, (0, common_1.Query)('type')),
    __param(13, (0, common_1.Query)('messageId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, Function, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], MessageController.prototype, "getMessages", null);
__decorate([
    (0, auth_decorators_1.ChatScoped)('fenced'),
    (0, common_1.Post)('send-text'),
    (0, idempotent_send_decorator_1.IdempotentSend)(),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Send a text message' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiBody)({ type: dto_1.SendTextMessageDto, examples: dto_1.SEND_TEXT_BODY_EXAMPLES }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Message sent',
        type: dto_1.MessageResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Session not active or invalid request',
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    (0, swagger_1.ApiResponse)({ status: 404, description: engine_status_responses_1.QUOTED_MESSAGE_NOT_FOUND_404 }),
    (0, swagger_1.ApiResponse)({ status: 501, description: `${engine_status_responses_1.CUSTOM_LINK_PREVIEW_501} ${QUOTED_SEND_501}` }),
    (0, swagger_1.ApiResponse)({ status: 413, description: engine_status_responses_1.PREVIEW_IMAGE_TOO_LARGE_413 }),
    (0, swagger_1.ApiResponse)({ status: 503, description: `${engine_status_responses_1.PREVIEW_IMAGE_PROXY_503} ${engine_status_responses_1.SEND_503}` }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.SendTextMessageDto]),
    __metadata("design:returntype", Promise)
], MessageController.prototype, "sendText", null);
__decorate([
    (0, auth_decorators_1.ChatScoped)('fenced'),
    (0, common_1.Post)('send-template'),
    (0, idempotent_send_decorator_1.IdempotentSend)(),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Render a stored text template and send it as a text message' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Template rendered and sent',
        type: dto_1.MessageResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Session not active or invalid request',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Template not found' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    (0, swagger_1.ApiResponse)({ status: 503, description: engine_status_responses_1.SEND_503 }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, send_template_dto_1.SendTemplateMessageDto]),
    __metadata("design:returntype", Promise)
], MessageController.prototype, "sendTemplate", null);
__decorate([
    (0, auth_decorators_1.ChatScoped)('fenced'),
    (0, common_1.Post)('send-image'),
    (0, idempotent_send_decorator_1.IdempotentSend)(),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Send an image message' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiBody)({ type: dto_1.SendMediaMessageDto, examples: dto_1.SEND_IMAGE_BODY_EXAMPLES }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Image sent',
        type: dto_1.MessageResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Session not active, invalid request, or a url that answers non-2xx, times out or cannot be reached',
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    (0, swagger_1.ApiResponse)({ status: 404, description: engine_status_responses_1.QUOTED_MESSAGE_NOT_FOUND_404 }),
    (0, swagger_1.ApiResponse)({ status: 501, description: `${engine_status_responses_1.CHANNEL_MEDIA_501} ${QUOTED_SEND_501}` }),
    (0, swagger_1.ApiResponse)({ status: 413, description: engine_status_responses_1.MEDIA_TOO_LARGE_413 }),
    (0, swagger_1.ApiResponse)({ status: 503, description: `${engine_status_responses_1.MEDIA_URL_PROXY_503} ${engine_status_responses_1.SEND_503}` }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.SendMediaMessageDto]),
    __metadata("design:returntype", Promise)
], MessageController.prototype, "sendImage", null);
__decorate([
    (0, auth_decorators_1.ChatScoped)('fenced'),
    (0, common_1.Post)('send-video'),
    (0, idempotent_send_decorator_1.IdempotentSend)(),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Send a video message' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiBody)({ type: dto_1.SendMediaMessageDto, examples: dto_1.SEND_VIDEO_BODY_EXAMPLES }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Video sent',
        type: dto_1.MessageResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Session not active, invalid request, or a url that answers non-2xx, times out or cannot be reached',
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    (0, swagger_1.ApiResponse)({ status: 404, description: engine_status_responses_1.QUOTED_MESSAGE_NOT_FOUND_404 }),
    (0, swagger_1.ApiResponse)({ status: 501, description: `${engine_status_responses_1.CHANNEL_MEDIA_501} ${QUOTED_SEND_501}` }),
    (0, swagger_1.ApiResponse)({ status: 413, description: engine_status_responses_1.MEDIA_TOO_LARGE_413 }),
    (0, swagger_1.ApiResponse)({ status: 503, description: `${engine_status_responses_1.MEDIA_URL_PROXY_503} ${engine_status_responses_1.SEND_503}` }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.SendMediaMessageDto]),
    __metadata("design:returntype", Promise)
], MessageController.prototype, "sendVideo", null);
__decorate([
    (0, auth_decorators_1.ChatScoped)('fenced'),
    (0, common_1.Post)('send-audio'),
    (0, idempotent_send_decorator_1.IdempotentSend)(),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Send an audio/voice message' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiBody)({ type: dto_1.SendAudioMessageDto, examples: dto_1.SEND_AUDIO_BODY_EXAMPLES }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Audio sent',
        type: dto_1.MessageResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Session not active, invalid request, or a url that answers non-2xx, times out or cannot be reached',
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    (0, swagger_1.ApiResponse)({ status: 404, description: engine_status_responses_1.QUOTED_MESSAGE_NOT_FOUND_404 }),
    (0, swagger_1.ApiResponse)({ status: 501, description: `${engine_status_responses_1.CHANNEL_MEDIA_501} ${QUOTED_SEND_501}` }),
    (0, swagger_1.ApiResponse)({ status: 413, description: engine_status_responses_1.MEDIA_TOO_LARGE_413 }),
    (0, swagger_1.ApiResponse)({ status: 503, description: `${engine_status_responses_1.MEDIA_URL_PROXY_503} ${engine_status_responses_1.SEND_503}` }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.SendAudioMessageDto]),
    __metadata("design:returntype", Promise)
], MessageController.prototype, "sendAudio", null);
__decorate([
    (0, auth_decorators_1.ChatScoped)('fenced'),
    (0, common_1.Post)('send-document'),
    (0, idempotent_send_decorator_1.IdempotentSend)(),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Send a document/file' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiBody)({ type: dto_1.SendMediaMessageDto, examples: dto_1.SEND_DOCUMENT_BODY_EXAMPLES }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Document sent',
        type: dto_1.MessageResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Session not active, invalid request, or a url that answers non-2xx, times out or cannot be reached',
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    (0, swagger_1.ApiResponse)({ status: 404, description: engine_status_responses_1.QUOTED_MESSAGE_NOT_FOUND_404 }),
    (0, swagger_1.ApiResponse)({ status: 501, description: `${engine_status_responses_1.CHANNEL_MEDIA_501} ${QUOTED_SEND_501}` }),
    (0, swagger_1.ApiResponse)({ status: 413, description: engine_status_responses_1.MEDIA_TOO_LARGE_413 }),
    (0, swagger_1.ApiResponse)({ status: 503, description: `${engine_status_responses_1.MEDIA_URL_PROXY_503} ${engine_status_responses_1.SEND_503}` }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.SendMediaMessageDto]),
    __metadata("design:returntype", Promise)
], MessageController.prototype, "sendDocument", null);
__decorate([
    (0, auth_decorators_1.ChatScoped)('fenced'),
    (0, common_1.Post)('send-location'),
    (0, idempotent_send_decorator_1.IdempotentSend)(),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Send a location message' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiBody)({ type: message_actions_dto_1.SendLocationDto, examples: dto_1.SEND_LOCATION_BODY_EXAMPLES }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Location sent',
        type: dto_1.MessageResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    (0, swagger_1.ApiResponse)({ status: 404, description: engine_status_responses_1.QUOTED_MESSAGE_NOT_FOUND_404 }),
    (0, swagger_1.ApiResponse)({ status: 400, description: engine_status_responses_1.RECIPIENT_UNREACHABLE_400 }),
    (0, swagger_1.ApiResponse)({ status: 501, description: wwebjsRefuses501(`a location to ${CHANNEL_OR_BROADCAST}`) }),
    (0, swagger_1.ApiResponse)({ status: 503, description: engine_status_responses_1.SEND_503 }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, message_actions_dto_1.SendLocationDto]),
    __metadata("design:returntype", Promise)
], MessageController.prototype, "sendLocation", null);
__decorate([
    (0, auth_decorators_1.ChatScoped)('fenced'),
    (0, common_1.Post)('send-contact'),
    (0, idempotent_send_decorator_1.IdempotentSend)(),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Send a contact card message' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiBody)({ type: message_actions_dto_1.SendContactDto, examples: dto_1.SEND_CONTACT_BODY_EXAMPLES }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Contact sent',
        type: dto_1.MessageResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    (0, swagger_1.ApiResponse)({ status: 404, description: engine_status_responses_1.QUOTED_MESSAGE_NOT_FOUND_404 }),
    (0, swagger_1.ApiResponse)({ status: 400, description: engine_status_responses_1.RECIPIENT_UNREACHABLE_400 }),
    (0, swagger_1.ApiResponse)({ status: 501, description: wwebjsRefuses501(`a contact card to ${CHANNEL_OR_BROADCAST}`) }),
    (0, swagger_1.ApiResponse)({ status: 503, description: engine_status_responses_1.SEND_503 }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, message_actions_dto_1.SendContactDto]),
    __metadata("design:returntype", Promise)
], MessageController.prototype, "sendContact", null);
__decorate([
    (0, auth_decorators_1.ChatScoped)('fenced'),
    (0, common_1.Post)('send-sticker'),
    (0, idempotent_send_decorator_1.IdempotentSend)(),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Send a sticker message' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiBody)({ type: dto_1.SendMediaMessageDto, examples: dto_1.SEND_STICKER_BODY_EXAMPLES }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Sticker sent',
        type: dto_1.MessageResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    (0, swagger_1.ApiResponse)({ status: 404, description: engine_status_responses_1.QUOTED_MESSAGE_NOT_FOUND_404 }),
    (0, swagger_1.ApiResponse)({ status: 400, description: engine_status_responses_1.RECIPIENT_UNREACHABLE_400 }),
    (0, swagger_1.ApiResponse)({
        status: 501,
        description: `${engine_status_responses_1.CHANNEL_MEDIA_501} ${wwebjsRefuses501('a sticker to a status or broadcast list (`@broadcast`) either')}`,
    }),
    (0, swagger_1.ApiResponse)({ status: 413, description: engine_status_responses_1.MEDIA_TOO_LARGE_413 }),
    (0, swagger_1.ApiResponse)({ status: 503, description: `${engine_status_responses_1.MEDIA_URL_PROXY_503} ${engine_status_responses_1.SEND_503}` }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.SendMediaMessageDto]),
    __metadata("design:returntype", Promise)
], MessageController.prototype, "sendSticker", null);
__decorate([
    (0, auth_decorators_1.ChatScoped)('fenced'),
    (0, common_1.Post)('send-poll'),
    (0, idempotent_send_decorator_1.IdempotentSend)(),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Send a native WhatsApp poll' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiBody)({ type: message_actions_dto_1.SendPollDto, examples: dto_1.SEND_POLL_BODY_EXAMPLES }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Poll sent',
        type: dto_1.MessageResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    (0, swagger_1.ApiResponse)({ status: 404, description: engine_status_responses_1.QUOTED_MESSAGE_NOT_FOUND_404 }),
    (0, swagger_1.ApiResponse)({ status: 400, description: engine_status_responses_1.RECIPIENT_UNREACHABLE_400 }),
    (0, swagger_1.ApiResponse)({
        status: 501,
        description: wwebjsRefuses501('a poll to a status or broadcast list (`@broadcast`), nor one with `quotedMessageId` to a channel (`<id>@newsletter`)'),
    }),
    (0, swagger_1.ApiResponse)({ status: 503, description: engine_status_responses_1.SEND_503 }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, message_actions_dto_1.SendPollDto]),
    __metadata("design:returntype", Promise)
], MessageController.prototype, "sendPoll", null);
__decorate([
    (0, auth_decorators_1.ChatQuotedAllowed)(),
    (0, auth_decorators_1.ChatScoped)('fenced'),
    (0, common_1.Post)('reply'),
    (0, idempotent_send_decorator_1.IdempotentSend)(),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Reply to a message' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Reply sent',
        type: dto_1.MessageResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    (0, swagger_1.ApiResponse)({ status: 400, description: engine_status_responses_1.RECIPIENT_UNREACHABLE_400 }),
    (0, swagger_1.ApiResponse)({ status: 404, description: engine_status_responses_1.MESSAGE_NOT_FOUND_404 }),
    (0, swagger_1.ApiResponse)({ status: 501, description: wwebjsRefuses501(`a reply to ${CHANNEL_OR_BROADCAST}`) }),
    (0, swagger_1.ApiResponse)({ status: 503, description: engine_status_responses_1.SEND_503 }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, message_actions_dto_1.ReplyMessageDto]),
    __metadata("design:returntype", Promise)
], MessageController.prototype, "reply", null);
__decorate([
    (0, auth_decorators_1.ChatScoped)('fenced'),
    (0, common_1.Post)('click-button'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({
        summary: 'Click a button on a WhatsApp Business prompt (Baileys only)',
        description: 'Sends a structured button/list reply quoted to a previously received prompt. Not a native UI ' +
            'tap, so WhatsApp may reject it or treat it differently. Classic button/template/list prompts ' +
            'are supported; native-flow interactiveMessage replies are unverified. whatsapp-web.js ' +
            'returns 501. ' +
            'URL/call CTA buttons cannot be clicked this way. The prompt must still be in the engine store ' +
            '(a reloaded bubble can render choices from persisted metadata and then 404).',
    }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Button reply sent',
        type: dto_1.MessageResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Session not active, prompt is not clickable, buttonId is not among its choices, or recipient unreachable',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: engine_status_responses_1.MESSAGE_NOT_FOUND_404 }),
    (0, swagger_1.ApiResponse)({ status: 501, description: engine_status_responses_1.ENGINE_NOT_SUPPORTED_501 }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    (0, swagger_1.ApiResponse)({ status: 503, description: engine_status_responses_1.SEND_503 }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, message_actions_dto_1.ClickButtonDto]),
    __metadata("design:returntype", Promise)
], MessageController.prototype, "clickButton", null);
__decorate([
    (0, auth_decorators_1.ChatScoped)('fenced'),
    (0, common_1.Post)('forward'),
    (0, idempotent_send_decorator_1.IdempotentSend)(),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Forward a message to another chat' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Message forwarded',
        type: dto_1.MessageResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    (0, swagger_1.ApiResponse)({ status: 400, description: engine_status_responses_1.RECIPIENT_UNREACHABLE_400 }),
    (0, swagger_1.ApiResponse)({ status: 404, description: engine_status_responses_1.MESSAGE_NOT_FOUND_404 }),
    (0, swagger_1.ApiResponse)({ status: 503, description: engine_status_responses_1.SEND_503 }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, message_actions_dto_1.ForwardMessageDto]),
    __metadata("design:returntype", Promise)
], MessageController.prototype, "forward", null);
__decorate([
    (0, auth_decorators_1.ChatScoped)('fenced'),
    (0, common_1.Post)('react'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Add or remove a reaction to a message' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Reaction added or removed. Send empty emoji to remove reaction.',
        type: message_responses_dto_1.MessageActionResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Session not active or invalid request',
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    (0, swagger_1.ApiResponse)({ status: 404, description: engine_status_responses_1.MESSAGE_NOT_FOUND_404 }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: engine_status_responses_1.SEND_503 +
            ' ' +
            'The whatsapp-web.js page connection died mid-request. The change may or may not have been applied; ' +
            'repeating the request is safe, since it converges on the same state.',
    }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, message_actions_dto_1.ReactMessageDto]),
    __metadata("design:returntype", Promise)
], MessageController.prototype, "react", null);
__decorate([
    (0, common_1.Get)('batch/:batchId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get batch processing status' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiParam)({ name: 'batchId', description: 'Batch ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Batch status and progress',
        type: bulk_message_dto_1.BatchStatusResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Batch not found',
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'The calling key is restricted with `allowedChats`. A batch row has no key owner, so the ' +
            "status cannot be checked against the key's allowlist and a chat-restricted key is refused; " +
            'use the single-send routes instead.',
    }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('batchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MessageController.prototype, "getBatchStatus", null);
__decorate([
    (0, common_1.Post)('batch/:batchId/cancel'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel a running batch' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiParam)({ name: 'batchId', description: 'Batch ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Batch cancelled',
        type: bulk_message_dto_1.BatchCancelResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'The calling key is restricted with `allowedChats`. A batch row has no key owner, so the ' +
            "cancel cannot be checked against the key's allowlist and a chat-restricted key is refused.",
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Batch already completed, cancelled, or failed (terminal statuses are exclusive)',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Batch not found',
    }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('batchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MessageController.prototype, "cancelBatch", null);
__decorate([
    (0, auth_decorators_1.ChatScoped)('fenced'),
    (0, common_1.Get)(':chatId/history'),
    (0, swagger_1.ApiOperation)({
        summary: 'Fetch chat history live from WhatsApp',
        description: 'Reads messages directly from the WhatsApp client for the given chat, bypassing the local DB. ' +
            'Useful for retrieving messages that arrived before the gateway was started.',
    }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiParam)({ name: 'chatId', description: 'Chat ID (e.g. 1234567890@c.us or groupId@g.us)' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: 'integer', description: 'Max messages to return (default 50)' }),
    (0, swagger_1.ApiQuery)({
        name: 'includeMedia',
        required: false,
        type: Boolean,
        description: 'When true, downloads media (base64) for messages that have it. Slower; default false.',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'deep',
        required: false,
        type: Boolean,
        description: 'When true, raises the limit ceiling from 100 to 2000 for reaching further back in history ' +
            '(whatsapp-web.js only; loads earlier messages on demand). Forces metadata-only (includeMedia ' +
            'is ignored). Large/slow requests may increase WhatsApp rate-limiting risk; default false.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Chat history (most recent messages, oldest first)',
        type: [message_responses_dto_1.ChatHistoryMessageDto],
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Session not active' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    (0, swagger_1.ApiResponse)({ status: 501, description: engine_status_responses_1.ENGINE_NOT_SUPPORTED_501 }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'The whatsapp-web.js page connection died mid-read, so nothing could be read. Retry once the ' +
            'session is ready again.',
    }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('chatId')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('includeMedia')),
    __param(4, (0, common_1.Query)('deep')),
    __param(5, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], MessageController.prototype, "getChatHistory", null);
__decorate([
    (0, auth_decorators_1.ChatScoped)('fenced'),
    (0, common_1.Get)(':chatId/:messageId/reactions'),
    (0, swagger_1.ApiOperation)({ summary: 'Get reactions for a specific message' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiParam)({ name: 'chatId', description: 'Chat ID containing the message' }),
    (0, swagger_1.ApiParam)({ name: 'messageId', description: 'Message ID to get reactions for' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'List of reactions with senders',
        type: [message_responses_dto_1.MessageReactionDto],
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Session not active' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    (0, swagger_1.ApiResponse)({ status: 404, description: engine_status_responses_1.MESSAGE_NOT_FOUND_404 }),
    (0, swagger_1.ApiResponse)({ status: 501, description: engine_status_responses_1.ENGINE_NOT_SUPPORTED_501 }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'The whatsapp-web.js page connection died mid-read, so nothing could be read. Retry once the ' +
            'session is ready again.',
    }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('chatId')),
    __param(2, (0, common_1.Param)('messageId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], MessageController.prototype, "getReactions", null);
__decorate([
    (0, auth_decorators_1.ChatScoped)('fenced'),
    (0, common_1.Get)(':chatId/:messageId/media'),
    (0, swagger_1.ApiOperation)({ summary: 'Download a message’s stored media' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiParam)({ name: 'chatId', description: 'Chat ID containing the message' }),
    (0, swagger_1.ApiParam)({ name: 'messageId', description: 'WhatsApp message ID whose media to download' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'The media bytes — the archived file when one exists, else the inline copy stored on the ' +
            'message row (which is how media sent by this account is served) — as an attachment.',
        content: { 'application/octet-stream': { schema: { type: 'string', format: 'binary' } } },
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'No stored media for this message — it carries no media, media download was disabled or the ' +
            'payload was over the cap when it was stored (size-only marker), it was a URL-based API send ' +
            '(the gateway stores none of those bytes, though on whatsapp-web.js the own-send echo may), or ' +
            'the message is not in this gateway’s history.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'On S3 storage, the gateway already has 50 media downloads open across the status and chat media ' +
            'routes. Retry once the Retry-After header (1 second) has passed.',
    }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('chatId')),
    __param(2, (0, common_1.Param)('messageId')),
    __param(3, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], MessageController.prototype, "getChatMedia", null);
__decorate([
    (0, auth_decorators_1.ChatScoped)('fenced'),
    (0, common_1.Post)('delete'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a message' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Message deleted',
        type: message_responses_dto_1.MessageActionResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Session not active or invalid request',
    }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: engine_status_responses_1.SEND_503 +
            ' ' +
            'WhatsApp did not answer within the request budget. The change may or may not have been applied — ' +
            'the gateway stopped waiting for a confirmation that never came.',
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    (0, swagger_1.ApiResponse)({ status: 404, description: engine_status_responses_1.MESSAGE_NOT_FOUND_404 }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, message_actions_dto_1.DeleteMessageDto]),
    __metadata("design:returntype", Promise)
], MessageController.prototype, "deleteMessage", null);
__decorate([
    (0, auth_decorators_1.ChatScoped)('fenced'),
    (0, common_1.Post)('vote-poll'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Cast a vote on a poll' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Vote cast', type: message_responses_dto_1.MessageActionResponseDto }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Session not active, the target message is not a poll, or `POLL_OPTION_NOT_FOUND`: none of the ' +
            'option texts match the poll (the body lists `validOptions`). Nothing is sent, so the current vote stays.',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Poll not found in the chat’s recent history' }),
    (0, swagger_1.ApiResponse)({ status: 501, description: 'Not supported on the Baileys engine' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'The whatsapp-web.js page connection died mid-request. The change may or may not have been applied; ' +
            'repeating the request is safe, since it converges on the same state.',
    }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, message_actions_dto_1.VotePollDto]),
    __metadata("design:returntype", Promise)
], MessageController.prototype, "votePoll", null);
__decorate([
    (0, auth_decorators_1.ChatScoped)('fenced'),
    (0, common_1.Post)('pin'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Pin a message in its chat' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Message pinned', type: message_responses_dto_1.MessageActionResponseDto }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Session not active, or durationSeconds is not one of 86400 / 604800 / 2592000',
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'The whatsapp-web.js engine refused the pin (in a group only admins may pin). The Baileys ' +
            'engine has no acceptance signal and answers 200.',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Message not found in the chat' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: engine_status_responses_1.SEND_503 +
            ' ' +
            'The whatsapp-web.js page connection died mid-request. The pin may or may not have been applied; a ' +
            'retry is safe, but it restarts the pin duration from the moment it succeeds.',
    }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, message_actions_dto_1.PinMessageDto]),
    __metadata("design:returntype", Promise)
], MessageController.prototype, "pinMessage", null);
__decorate([
    (0, auth_decorators_1.ChatScoped)('fenced'),
    (0, common_1.Post)('unpin'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Remove a message’s pin' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Message unpinned', type: message_responses_dto_1.MessageActionResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Session not active' }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'The whatsapp-web.js engine refused the unpin (in a group only admins may unpin). The Baileys ' +
            'engine has no acceptance signal and answers 200.',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Message not found in the chat' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: engine_status_responses_1.SEND_503 +
            ' ' +
            'The whatsapp-web.js page connection died mid-request. The change may or may not have been applied; ' +
            'repeating the request is safe, since it converges on the same state.',
    }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, message_actions_dto_1.UnpinMessageDto]),
    __metadata("design:returntype", Promise)
], MessageController.prototype, "unpinMessage", null);
__decorate([
    (0, auth_decorators_1.ChatScoped)('fenced'),
    (0, common_1.Post)('star'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Star or unstar a message' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Instruction delivered. On whatsapp-web.js the engine silently ignores a message it will not ' +
            'star, so this does not guarantee the star is set.',
        type: message_responses_dto_1.MessageActionResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Session not active' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Message not found in the chat' }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'WhatsApp did not answer within the request budget. The change may or may not have been applied — ' +
            'the gateway stopped waiting for a confirmation that never came.',
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, message_actions_dto_1.StarMessageDto]),
    __metadata("design:returntype", Promise)
], MessageController.prototype, "starMessage", null);
__decorate([
    (0, auth_decorators_1.ChatScoped)('fenced'),
    (0, common_1.Post)('edit'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Edit the text of a message sent by this account' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Message edited',
        type: dto_1.MessageResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Session not active, invalid request, or the send was blocked by a plugin',
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'The engine refused the edit. The Baileys adapter refuses a message the account did not send; ' +
            'whatsapp-web.js reads the refusal from the page, which also covers a message that is not text. ' +
            'Past its own guard the Baileys engine has no acceptance signal and answers 200.',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Message not found' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: engine_status_responses_1.SEND_503 +
            ' ' +
            'The whatsapp-web.js page connection died mid-request. The change may or may not have been applied; ' +
            'repeating the request is safe, since it converges on the same state.',
    }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, message_actions_dto_1.EditMessageDto]),
    __metadata("design:returntype", Promise)
], MessageController.prototype, "edit", null);
__decorate([
    (0, auth_decorators_1.ChatScoped)('fenced'),
    (0, common_1.Post)('send-bulk'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, common_1.HttpCode)(common_1.HttpStatus.ACCEPTED),
    (0, swagger_1.ApiOperation)({ summary: 'Send messages to multiple recipients (async batch processing)' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiResponse)({
        status: 202,
        description: 'Batch created and processing started',
        type: bulk_message_dto_1.BulkMessageResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Session not active or invalid request',
    }),
    (0, swagger_1.ApiResponse)({ status: 413, description: engine_status_responses_1.BULK_MEDIA_TOO_LARGE_413 }),
    (0, swagger_1.ApiResponse)({
        status: 429,
        description: 'Too many bulk batches in progress on this node (BULK_MAX_CONCURRENT_BATCHES); retry shortly',
    }),
    (0, swagger_1.ApiResponse)({ status: 503, description: 'The server is shutting down; retry the batch shortly' }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, bulk_message_dto_1.SendBulkMessageDto]),
    __metadata("design:returntype", Promise)
], MessageController.prototype, "sendBulk", null);
exports.MessageController = MessageController = __decorate([
    (0, swagger_1.ApiTags)('messages'),
    (0, common_1.Controller)('sessions/:sessionId/messages'),
    __metadata("design:paramtypes", [message_service_1.MessageService,
        bulk_message_service_1.BulkMessageService,
        chat_scope_service_1.ChatScopeService])
], MessageController);
//# sourceMappingURL=message.controller.js.map