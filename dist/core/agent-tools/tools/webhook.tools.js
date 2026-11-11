"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookTools = webhookTools;
const zod_1 = require("zod");
const api_key_entity_1 = require("../../../modules/auth/entities/api-key.entity");
const webhook_dto_1 = require("../../../modules/webhook/dto/webhook.dto");
const tool_descriptor_1 = require("../tool-descriptor");
const sessionId = zod_1.z.string().min(1).describe('Session UUID (the session id, not the name)');
function webhookTools(webhook) {
    return [
        (0, tool_descriptor_1.defineTool)({
            name: 'WebhooksList',
            description: 'List all webhooks the API key is allowed to see, across all its accessible sessions. Supports limit/offset paging.',
            tier: 'read',
            requiredRole: api_key_entity_1.ApiKeyRole.OPERATOR,
            inputSchema: zod_1.z.object({
                limit: zod_1.z.number().int().min(1).max(1000).optional(),
                offset: zod_1.z.number().int().min(0).optional(),
            }),
            handler: (input, apiKey) => webhook
                .findAll(apiKey.allowedSessions, { limit: input.limit, offset: input.offset })
                .then(ws => webhook_dto_1.WebhookResponseDto.fromEntities(ws)),
        }),
        (0, tool_descriptor_1.defineTool)({
            name: 'WebhookFindBySession',
            description: 'List all webhooks registered for a specific session.',
            tier: 'read',
            requiredRole: api_key_entity_1.ApiKeyRole.OPERATOR,
            sessionScoped: true,
            inputSchema: zod_1.z.object({ sessionId }),
            handler: input => webhook.findBySession(input.sessionId).then(ws => webhook_dto_1.WebhookResponseDto.fromEntities(ws)),
        }),
        (0, tool_descriptor_1.defineTool)({
            name: 'WebhookFindOne',
            description: 'Get details for a specific webhook by ID within a session.',
            tier: 'read',
            requiredRole: api_key_entity_1.ApiKeyRole.OPERATOR,
            sessionScoped: true,
            inputSchema: zod_1.z.object({
                sessionId,
                webhookId: zod_1.z.string().min(1).describe('Webhook UUID'),
            }),
            handler: input => webhook.findOne(input.sessionId, input.webhookId).then(w => webhook_dto_1.WebhookResponseDto.fromEntity(w)),
        }),
    ];
}
//# sourceMappingURL=webhook.tools.js.map