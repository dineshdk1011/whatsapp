"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionTools = sessionTools;
const zod_1 = require("zod");
const api_key_entity_1 = require("../../../modules/auth/entities/api-key.entity");
const session_response_dto_1 = require("../../../modules/session/dto/session-response.dto");
const mark_chat_read_dto_1 = require("../../../modules/session/dto/mark-chat-read.dto");
const chat_id_schema_1 = require("../chat-id-schema");
const tool_descriptor_1 = require("../tool-descriptor");
const paginate_1 = require("../../../common/utils/paginate");
const sessionId = zod_1.z.string().min(1).describe('Session UUID (the session id, not the name)');
function sessionTools(session) {
    return [
        (0, tool_descriptor_1.defineTool)({
            name: 'SessionFindAll',
            description: 'List the WhatsApp sessions this API key may access (id, name, status). Use to discover available sessions before calling session-scoped tools. Supports limit/offset paging and an exact, case-sensitive name filter.',
            tier: 'read',
            inputSchema: zod_1.z.object({
                limit: zod_1.z.number().int().min(1).max(1000).optional(),
                offset: zod_1.z.number().int().min(0).optional(),
                name: zod_1.z.string().min(1).describe('Exact session name (case-sensitive)').optional(),
            }),
            handler: (input, apiKey) => session
                .findAll(apiKey.allowedSessions, { limit: input.limit, offset: input.offset, name: input.name })
                .then(ss => ss.map(s => session_response_dto_1.SessionResponseDto.fromEntity(s, session.engineLoaded(s)))),
        }),
        (0, tool_descriptor_1.defineTool)({
            name: 'SessionFindOne',
            chatScope: 'agnostic',
            description: 'Get one session by its UUID, including connection status and phone number.',
            tier: 'read',
            sessionScoped: true,
            inputSchema: zod_1.z.object({ sessionId }),
            handler: input => session.findOne(input.sessionId).then(s => session_response_dto_1.SessionResponseDto.fromEntity(s, session.engineLoaded(s))),
        }),
        (0, tool_descriptor_1.defineTool)({
            name: 'SessionGetChats',
            chatScope: 'filtered',
            description: 'List recent chats for a session (most recent first). Use limit/offset to page through large lists.',
            tier: 'read',
            sessionScoped: true,
            inputSchema: zod_1.z.object({
                sessionId,
                limit: zod_1.z.number().int().min(1).max(1000).optional(),
                offset: zod_1.z.number().int().min(0).optional(),
            }),
            handler: async (input, apiKey, chatScope) => {
                if (!chatScope?.isRestricted(apiKey)) {
                    return session.getChats(input.sessionId, { limit: input.limit, offset: input.offset });
                }
                const visible = await chatScope.filter(apiKey, await session.listChats(input.sessionId, input.offset), chat => chat.id);
                return (0, paginate_1.paginate)(visible, input.limit, input.offset);
            },
        }),
        (0, tool_descriptor_1.defineTool)({
            name: 'SessionGetStats',
            description: 'Aggregate session counts (total, active, ready, disconnected) the key is allowed to see.',
            tier: 'read',
            inputSchema: zod_1.z.object({}),
            handler: (_input, apiKey) => session.getStats(apiKey.allowedSessions),
        }),
        (0, tool_descriptor_1.defineTool)({
            name: 'SessionSubscribePresence',
            chatScope: ['chatId'],
            description: "Subscribe to a chat's presence (online / typing / recording). Updates then arrive as " +
                'presence.update events; read the latest with SessionGetPresence. The subscription is lost on ' +
                'a reconnect and must be re-issued. Not available on the whatsapp-web.js engine. Requires ' +
                'OPERATOR role.',
            tier: 'write',
            requiredRole: api_key_entity_1.ApiKeyRole.OPERATOR,
            sessionScoped: true,
            inputSchema: zod_1.z.object({
                sessionId,
                chatId: chat_id_schema_1.chatJidSchema.describe('Chat JID (e.g. 1234567890@c.us)'),
            }),
            handler: input => session.subscribeToPresence(input.sessionId, input.chatId).then(() => ({ success: true })),
        }),
        (0, tool_descriptor_1.defineTool)({
            name: 'SessionGetPresence',
            chatScope: ['chatId'],
            description: 'The last presence reported for a chat, or null when none has been — the chat was never ' +
                'subscribed, or nothing has changed since. Subscribe first with SessionSubscribePresence.',
            tier: 'read',
            requiredRole: api_key_entity_1.ApiKeyRole.VIEWER,
            sessionScoped: true,
            inputSchema: zod_1.z.object({
                sessionId,
                chatId: chat_id_schema_1.chatIdSchema.describe('Chat JID (e.g. 1234567890@c.us)'),
            }),
            handler: input => session.getPresence(input.sessionId, input.chatId),
        }),
        (0, tool_descriptor_1.defineTool)({
            name: 'SessionMarkChatRead',
            chatScope: ['chatId'],
            description: 'Mark a chat as read (clears unread count). Requires OPERATOR role.',
            tier: 'write',
            requiredRole: api_key_entity_1.ApiKeyRole.OPERATOR,
            sessionScoped: true,
            inputSchema: zod_1.z.object({
                sessionId,
                chatId: chat_id_schema_1.chatJidSchema.describe('Chat JID (e.g. 1234567890@c.us)'),
                messageIds: zod_1.z
                    .array(zod_1.z.string().regex(mark_chat_read_dto_1.MARK_READ_MESSAGE_ID_PATTERN, mark_chat_read_dto_1.MARK_READ_MESSAGE_ID_MESSAGE))
                    .nonempty()
                    .max(mark_chat_read_dto_1.MARK_READ_MESSAGE_IDS_MAX)
                    .optional()
                    .describe('Specific message IDs to acknowledge. Baileys acknowledges individual messages, so without ' +
                    'this only the newest received message gets a receipt: the one held in memory, else the ' +
                    'newest received one the gateway stored.'),
            }),
            handler: input => session.sendSeen(input.sessionId, input.chatId, input.messageIds).then(success => ({ success })),
        }),
        (0, tool_descriptor_1.defineTool)({
            name: 'SessionMarkChatUnread',
            chatScope: ['chatId'],
            description: 'Mark a chat as unread. Requires OPERATOR role.',
            tier: 'write',
            requiredRole: api_key_entity_1.ApiKeyRole.OPERATOR,
            sessionScoped: true,
            inputSchema: zod_1.z.object({
                sessionId,
                chatId: chat_id_schema_1.chatJidSchema.describe('Chat JID (e.g. 1234567890@c.us)'),
            }),
            handler: input => session.markUnread(input.sessionId, input.chatId).then(success => ({ success })),
        }),
        (0, tool_descriptor_1.defineTool)({
            name: 'SessionSendChatState',
            chatScope: ['chatId'],
            description: "Show a typing/recording indicator in a chat, or clear it with 'paused'. Requires OPERATOR role.",
            tier: 'write',
            requiredRole: api_key_entity_1.ApiKeyRole.OPERATOR,
            sessionScoped: true,
            inputSchema: zod_1.z.object({
                sessionId,
                chatId: chat_id_schema_1.chatJidSchema.describe('Chat JID (e.g. 1234567890@c.us)'),
                state: zod_1.z
                    .enum(['typing', 'recording', 'paused'])
                    .describe("'typing' or 'recording' shows the indicator; 'paused' clears it"),
            }),
            handler: input => session.sendChatState(input.sessionId, input.chatId, input.state).then(() => ({ success: true })),
        }),
    ];
}
//# sourceMappingURL=session.tools.js.map