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
exports.WebhookController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const webhook_service_1 = require("./webhook.service");
const dto_1 = require("./dto");
const auth_decorators_1 = require("../auth/decorators/auth.decorators");
const api_key_entity_1 = require("../auth/entities/api-key.entity");
let WebhookController = class WebhookController {
    webhookService;
    constructor(webhookService) {
        this.webhookService = webhookService;
    }
    async create(sessionId, dto) {
        return dto_1.WebhookResponseDto.fromEntity(await this.webhookService.create(sessionId, dto));
    }
    async findBySession(sessionId) {
        return dto_1.WebhookResponseDto.fromEntities(await this.webhookService.findBySession(sessionId));
    }
    async findOne(sessionId, id) {
        return dto_1.WebhookResponseDto.fromEntity(await this.webhookService.findOne(sessionId, id));
    }
    async update(sessionId, id, dto) {
        return dto_1.WebhookResponseDto.fromEntity(await this.webhookService.update(sessionId, id, dto));
    }
    async test(sessionId, id) {
        return this.webhookService.test(sessionId, id);
    }
    async delete(sessionId, id) {
        return this.webhookService.delete(sessionId, id);
    }
};
exports.WebhookController = WebhookController;
__decorate([
    (0, common_1.Post)(),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Create a webhook for the session' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Webhook created',
        type: dto_1.WebhookResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Invalid body, the URL embeds credentials or is blocked by the SSRF policy, or the per-session webhook limit is reached',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Session not found' }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.CreateWebhookDto]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'List all webhooks for a session' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'List of webhooks',
        type: [dto_1.WebhookResponseDto],
    }),
    __param(0, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "findBySession", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Get a webhook by ID' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Webhook ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Webhook details',
        type: dto_1.WebhookResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Webhook not found' }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Update a webhook' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Webhook ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Webhook updated',
        type: dto_1.WebhookResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Invalid body, or a changed URL embeds credentials or is blocked by the SSRF policy',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Webhook not found' }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dto_1.UpdateWebhookDto]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/test'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Test a webhook by sending a test payload' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Webhook ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Test result', type: dto_1.WebhookTestResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Webhook not found' }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "test", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a webhook' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Webhook ID' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Webhook deleted' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Webhook not found' }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "delete", null);
exports.WebhookController = WebhookController = __decorate([
    (0, swagger_1.ApiTags)('webhooks'),
    (0, common_1.Controller)('sessions/:sessionId/webhooks'),
    __metadata("design:paramtypes", [webhook_service_1.WebhookService])
], WebhookController);
//# sourceMappingURL=webhook.controller.js.map