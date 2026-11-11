"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageTools = messageTools;
const zod_1 = require("zod");
const media_url_1 = require("../../../common/media/media-url");
const api_key_entity_1 = require("../../../modules/auth/entities/api-key.entity");
const media_cap_util_1 = require("../../../modules/message/media-cap.util");
const send_message_dto_1 = require("../../../modules/message/dto/send-message.dto");
const is_mention_wid_validator_1 = require("../../../modules/message/dto/is-mention-wid.validator");
const message_actions_dto_1 = require("../../../modules/message/dto/message-actions.dto");
const chat_id_schema_1 = require("../chat-id-schema");
const tool_descriptor_1 = require("../tool-descriptor");
const sessionId = zod_1.z.string().min(1).describe('Session UUID (the session id, not the name)');
const quotedMessageIdSchema = zod_1.z
    .string()
    .min(1)
    .optional()
    .describe('Quote an earlier message, making this send a reply. Engine-specific: whatsapp-web.js takes ' +
    'the serialized message id, Baileys the raw key id of a message it has already stored.');
const mediaUrl = (label) => zod_1.z.string().optional().describe(`${label} URL (http/https)`);
const hasValidMediaUrl = (input) => !!(0, media_cap_util_1.stripBase64DataUri)(input.base64) || input.url === undefined || (0, media_url_1.isMediaUrl)(input.url);
const mentionsSchema = zod_1.z
    .array(zod_1.z.string().max(send_message_dto_1.MENTION_WID_MAX_LENGTH).refine(is_mention_wid_validator_1.isMentionWid, 'must be an individual WID, e.g. 62811@c.us'))
    .max(send_message_dto_1.MENTIONS_MAX)
    .optional()
    .describe('WIDs to @mention (e.g. ["62811@c.us"]). The text or caption must also carry the matching ' +
    '@<number> token for WhatsApp to render the tag.');
const customLinkPreviewSchema = zod_1.z
    .object({
    url: zod_1.z
        .string()
        .min(1)
        .max(send_message_dto_1.CUSTOM_PREVIEW_URL_MAX_LENGTH)
        .describe('The URL as it appears in the message text; WhatsApp anchors the preview to it.'),
    title: zod_1.z
        .string()
        .min(1)
        .max(send_message_dto_1.CUSTOM_PREVIEW_TITLE_MAX_LENGTH)
        .describe('Required: WhatsApp renders no preview without a title.'),
    description: zod_1.z.string().max(send_message_dto_1.CUSTOM_PREVIEW_DESCRIPTION_MAX_LENGTH).optional(),
    thumbnailUrl: zod_1.z
        .string()
        .optional()
        .describe('Preview image URL (http/https), fetched under the media SSRF rules; renders the large card.'),
    thumbnailBase64: zod_1.z
        .string()
        .optional()
        .describe('Preview image as base64, at most 5 MiB decoded. Wins over thumbnailUrl.'),
})
    .refine(p => hasValidMediaUrl({ url: p.thumbnailUrl, base64: p.thumbnailBase64 }), {
    error: media_url_1.MEDIA_URL_MESSAGE,
    path: ['thumbnailUrl'],
})
    .optional()
    .describe('Attach a preview you supply instead of one fetched from the URL, so the page is not fetched and ' +
    'it works for a URL the gateway cannot reach. Only an optional thumbnail image is fetched. ' +
    'Baileys only: whatsapp-web.js answers 501.');
function messageTools(message) {
    return [
        (0, tool_descriptor_1.defineTool)({
            name: 'MessageList',
            chatScope: ['chatId'],
            description: 'List persisted messages for a session, optionally filtered by chatId or sender. Reads from the local DB.',
            tier: 'read',
            sessionScoped: true,
            inputSchema: zod_1.z.object({
                sessionId,
                chatId: zod_1.z.string().max(send_message_dto_1.CHAT_ID_MAX_LENGTH).optional().describe('Filter to a specific chat JID'),
                from: zod_1.z.string().optional().describe('Filter by sender phone or JID'),
                limit: zod_1.z.number().int().min(1).max(100).optional(),
                offset: zod_1.z.number().int().min(0).optional(),
            }),
            handler: input => message.getMessages(input.sessionId, {
                chatId: input.chatId,
                from: input.from,
                limit: input.limit,
                offset: input.offset,
            }),
        }),
        (0, tool_descriptor_1.defineTool)({
            name: 'MessageHistory',
            chatScope: ['chatId'],
            description: 'Fetch live chat history from WhatsApp for a specific chat. Bypasses the local DB — useful for messages that arrived before the gateway started. ' +
                'Requires the whatsapp-web.js engine; Baileys answers 501 and a retry cannot succeed, so use MessageList for stored messages.',
            tier: 'read',
            sessionScoped: true,
            inputSchema: zod_1.z.object({
                sessionId,
                chatId: chat_id_schema_1.chatIdSchema.describe('Chat JID (e.g. 1234567890@c.us or groupId@g.us)'),
                limit: zod_1.z
                    .number()
                    .int()
                    .min(1)
                    .max(2000)
                    .optional()
                    .describe('Number of messages to fetch; without deep:true the engine caps at 100'),
                includeMedia: zod_1.z.boolean().optional().describe('Download media as base64 (slower)'),
                deep: zod_1.z.boolean().optional().describe('Raise limit ceiling to 2000 for reaching further back in history'),
            }),
            handler: (input, _apiKey, _chatScope, signal) => message.getChatHistory(input.sessionId, input.chatId, input.limit, input.includeMedia, input.deep, signal),
        }),
        (0, tool_descriptor_1.defineTool)({
            name: 'MessageGetReactions',
            chatScope: ['chatId'],
            description: 'Get reactions for a specific message, including which contacts sent which emoji. ' +
                'Requires the whatsapp-web.js engine; Baileys answers 501 and a retry cannot succeed.',
            tier: 'read',
            sessionScoped: true,
            inputSchema: zod_1.z.object({
                sessionId,
                chatId: chat_id_schema_1.chatIdSchema.describe('Chat JID containing the message'),
                messageId: zod_1.z.string().min(1).describe('Message ID to get reactions for'),
            }),
            handler: input => message.getMessageReactions(input.sessionId, input.chatId, input.messageId),
        }),
        (0, tool_descriptor_1.defineTool)({
            name: 'MessageSendText',
            chatScope: ['chatId'],
            description: 'Send a plain text message to a chat or group. Requires OPERATOR role.',
            tier: 'write',
            requiredRole: api_key_entity_1.ApiKeyRole.OPERATOR,
            sessionScoped: true,
            inputSchema: zod_1.z.object({
                sessionId,
                chatId: chat_id_schema_1.chatJidSchema.describe('Chat JID (e.g. 628123456789@c.us or groupId@g.us)'),
                text: zod_1.z.string().min(1).max(send_message_dto_1.MESSAGE_TEXT_MAX_LENGTH).describe('Text message content'),
                linkPreview: zod_1.z
                    .boolean()
                    .optional()
                    .describe('Set false to suppress the URL preview. Guaranteed only in that direction — leaving it ' +
                    'unset means the engine default, and the engines differ.'),
                quotedMessageId: quotedMessageIdSchema,
                mentions: mentionsSchema,
                customLinkPreview: customLinkPreviewSchema,
            }),
            handler: input => message.sendText(input.sessionId, {
                chatId: input.chatId,
                text: input.text,
                ...(input.linkPreview === undefined ? {} : { linkPreview: input.linkPreview }),
                quotedMessageId: input.quotedMessageId,
                mentions: input.mentions,
                customLinkPreview: input.customLinkPreview,
            }),
        }),
        (0, tool_descriptor_1.defineTool)({
            name: 'MessageSendImage',
            chatScope: ['chatId'],
            description: 'Send an image message via URL or base64. Requires OPERATOR role.',
            tier: 'write',
            requiredRole: api_key_entity_1.ApiKeyRole.OPERATOR,
            sessionScoped: true,
            inputSchema: zod_1.z
                .object({
                sessionId,
                chatId: chat_id_schema_1.chatJidSchema.describe('Chat JID'),
                url: mediaUrl('Image'),
                base64: zod_1.z.string().optional().describe('Base64-encoded image data'),
                mimetype: zod_1.z.string().optional().describe('MIME type (required when using base64)'),
                filename: zod_1.z.string().max(255).optional(),
                caption: zod_1.z.string().max(1024).optional(),
                quotedMessageId: quotedMessageIdSchema,
                mentions: mentionsSchema,
            })
                .refine(hasValidMediaUrl, { error: media_url_1.MEDIA_URL_MESSAGE, path: ['url'] }),
            handler: input => message.sendImage(input.sessionId, {
                chatId: input.chatId,
                url: input.url,
                base64: input.base64,
                mimetype: input.mimetype,
                filename: input.filename,
                caption: input.caption,
                quotedMessageId: input.quotedMessageId,
                mentions: input.mentions,
            }),
        }),
        (0, tool_descriptor_1.defineTool)({
            name: 'MessageSendVideo',
            chatScope: ['chatId'],
            description: 'Send a video message via URL or base64. Requires OPERATOR role.',
            tier: 'write',
            requiredRole: api_key_entity_1.ApiKeyRole.OPERATOR,
            sessionScoped: true,
            inputSchema: zod_1.z
                .object({
                sessionId,
                chatId: chat_id_schema_1.chatJidSchema.describe('Chat JID'),
                url: mediaUrl('Video'),
                base64: zod_1.z.string().optional().describe('Base64-encoded video data'),
                mimetype: zod_1.z.string().optional().describe('MIME type (required when using base64)'),
                filename: zod_1.z.string().max(255).optional(),
                caption: zod_1.z.string().max(1024).optional(),
                quotedMessageId: quotedMessageIdSchema,
                mentions: mentionsSchema,
            })
                .refine(hasValidMediaUrl, { error: media_url_1.MEDIA_URL_MESSAGE, path: ['url'] }),
            handler: input => message.sendVideo(input.sessionId, {
                chatId: input.chatId,
                url: input.url,
                base64: input.base64,
                mimetype: input.mimetype,
                filename: input.filename,
                caption: input.caption,
                quotedMessageId: input.quotedMessageId,
                mentions: input.mentions,
            }),
        }),
        (0, tool_descriptor_1.defineTool)({
            name: 'MessageSendAudio',
            chatScope: ['chatId'],
            description: 'Send an audio/voice message via URL or base64. Requires OPERATOR role.',
            tier: 'write',
            requiredRole: api_key_entity_1.ApiKeyRole.OPERATOR,
            sessionScoped: true,
            inputSchema: zod_1.z
                .object({
                sessionId,
                chatId: chat_id_schema_1.chatJidSchema.describe('Chat JID'),
                url: mediaUrl('Audio'),
                base64: zod_1.z.string().optional().describe('Base64-encoded audio data'),
                mimetype: zod_1.z.string().optional().describe('MIME type (required when using base64)'),
                filename: zod_1.z.string().max(255).optional(),
                caption: zod_1.z.string().max(1024).optional(),
                ptt: zod_1.z.boolean().optional().describe('Send as a WhatsApp voice note (PTT)'),
                quotedMessageId: quotedMessageIdSchema,
                mentions: mentionsSchema,
            })
                .refine(hasValidMediaUrl, { error: media_url_1.MEDIA_URL_MESSAGE, path: ['url'] }),
            handler: input => message.sendAudio(input.sessionId, {
                chatId: input.chatId,
                url: input.url,
                base64: input.base64,
                mimetype: input.mimetype,
                filename: input.filename,
                caption: input.caption,
                ptt: input.ptt,
                quotedMessageId: input.quotedMessageId,
                mentions: input.mentions,
            }),
        }),
        (0, tool_descriptor_1.defineTool)({
            name: 'MessageSendDocument',
            chatScope: ['chatId'],
            description: 'Send a document/file message via URL or base64. Requires OPERATOR role.',
            tier: 'write',
            requiredRole: api_key_entity_1.ApiKeyRole.OPERATOR,
            sessionScoped: true,
            inputSchema: zod_1.z
                .object({
                sessionId,
                chatId: chat_id_schema_1.chatJidSchema.describe('Chat JID'),
                url: mediaUrl('Document'),
                base64: zod_1.z.string().optional().describe('Base64-encoded document data'),
                mimetype: zod_1.z.string().optional().describe('MIME type (required when using base64)'),
                filename: zod_1.z.string().max(255).optional(),
                caption: zod_1.z.string().max(1024).optional(),
                quotedMessageId: quotedMessageIdSchema,
                mentions: mentionsSchema,
            })
                .refine(hasValidMediaUrl, { error: media_url_1.MEDIA_URL_MESSAGE, path: ['url'] }),
            handler: input => message.sendDocument(input.sessionId, {
                chatId: input.chatId,
                url: input.url,
                base64: input.base64,
                mimetype: input.mimetype,
                filename: input.filename,
                caption: input.caption,
                quotedMessageId: input.quotedMessageId,
                mentions: input.mentions,
            }),
        }),
        (0, tool_descriptor_1.defineTool)({
            name: 'MessageSendLocation',
            chatScope: ['chatId'],
            description: 'Send a location pin message. Requires OPERATOR role.',
            tier: 'write',
            requiredRole: api_key_entity_1.ApiKeyRole.OPERATOR,
            sessionScoped: true,
            inputSchema: zod_1.z.object({
                sessionId,
                chatId: chat_id_schema_1.chatJidSchema.describe('Chat JID'),
                latitude: zod_1.z.number().min(-90).max(90).describe('Latitude coordinate'),
                longitude: zod_1.z.number().min(-180).max(180).describe('Longitude coordinate'),
                description: zod_1.z.string().max(message_actions_dto_1.LOCATION_TEXT_MAX_LENGTH).optional().describe('Location label/description'),
                address: zod_1.z.string().max(message_actions_dto_1.LOCATION_TEXT_MAX_LENGTH).optional().describe('Street address'),
                quotedMessageId: quotedMessageIdSchema,
            }),
            handler: input => message.sendLocation(input.sessionId, {
                chatId: input.chatId,
                latitude: input.latitude,
                longitude: input.longitude,
                description: input.description,
                address: input.address,
                quotedMessageId: input.quotedMessageId,
            }),
        }),
        (0, tool_descriptor_1.defineTool)({
            name: 'MessageSendContact',
            chatScope: ['chatId'],
            description: 'Send a contact card message. Requires OPERATOR role.',
            tier: 'write',
            requiredRole: api_key_entity_1.ApiKeyRole.OPERATOR,
            sessionScoped: true,
            inputSchema: zod_1.z.object({
                sessionId,
                chatId: chat_id_schema_1.chatJidSchema.describe('Chat JID'),
                contactName: zod_1.z.string().min(1).max(message_actions_dto_1.CONTACT_NAME_MAX_LENGTH).describe('Display name of the contact to share'),
                contactNumber: zod_1.z
                    .string()
                    .min(1)
                    .max(message_actions_dto_1.CONTACT_NUMBER_MAX_LENGTH)
                    .describe('Phone number of the contact to share'),
                quotedMessageId: quotedMessageIdSchema,
            }),
            handler: input => message.sendContact(input.sessionId, {
                chatId: input.chatId,
                contactName: input.contactName,
                contactNumber: input.contactNumber,
                quotedMessageId: input.quotedMessageId,
            }),
        }),
        (0, tool_descriptor_1.defineTool)({
            name: 'MessageSendSticker',
            chatScope: ['chatId'],
            description: 'Send a sticker message via URL or base64. Requires OPERATOR role.',
            tier: 'write',
            requiredRole: api_key_entity_1.ApiKeyRole.OPERATOR,
            sessionScoped: true,
            inputSchema: zod_1.z
                .object({
                sessionId,
                chatId: chat_id_schema_1.chatJidSchema.describe('Chat JID'),
                url: mediaUrl('Sticker'),
                base64: zod_1.z.string().optional().describe('Base64-encoded sticker data'),
                mimetype: zod_1.z.string().optional().describe('MIME type (required when using base64)'),
                filename: zod_1.z.string().max(255).optional(),
                caption: zod_1.z.string().max(1024).optional(),
                quotedMessageId: quotedMessageIdSchema,
                mentions: mentionsSchema,
            })
                .refine(hasValidMediaUrl, { error: media_url_1.MEDIA_URL_MESSAGE, path: ['url'] }),
            handler: input => message.sendSticker(input.sessionId, {
                chatId: input.chatId,
                url: input.url,
                base64: input.base64,
                mimetype: input.mimetype,
                filename: input.filename,
                caption: input.caption,
                quotedMessageId: input.quotedMessageId,
                mentions: input.mentions,
            }),
        }),
        (0, tool_descriptor_1.defineTool)({
            name: 'MessageSendTemplate',
            chatScope: ['chatId'],
            description: 'Render a stored text template and send it as a text message. Provide either templateId or templateName. Requires OPERATOR role.',
            tier: 'write',
            requiredRole: api_key_entity_1.ApiKeyRole.OPERATOR,
            sessionScoped: true,
            inputSchema: zod_1.z.object({
                sessionId,
                chatId: chat_id_schema_1.chatJidSchema.describe('Chat JID'),
                templateId: zod_1.z.string().optional().describe('Template UUID'),
                templateName: zod_1.z.string().optional().describe('Template name slug'),
                vars: zod_1.z
                    .record(zod_1.z.string(), zod_1.z.string())
                    .optional()
                    .describe('Variables to substitute into {{placeholder}} tokens'),
                mentions: mentionsSchema,
            }),
            handler: input => message.sendTemplate(input.sessionId, {
                chatId: input.chatId,
                templateId: input.templateId,
                templateName: input.templateName,
                vars: input.vars,
                mentions: input.mentions,
            }),
        }),
        (0, tool_descriptor_1.defineTool)({
            name: 'MessageReply',
            chatQuotedAllowed: true,
            chatScope: ['chatId'],
            description: 'Reply to a specific message (quoted reply). Requires OPERATOR role.',
            tier: 'write',
            requiredRole: api_key_entity_1.ApiKeyRole.OPERATOR,
            sessionScoped: true,
            inputSchema: zod_1.z.object({
                sessionId,
                chatId: chat_id_schema_1.chatJidSchema.describe('Chat JID'),
                quotedMessageId: zod_1.z.string().min(1).describe('ID of the message to quote/reply to'),
                text: zod_1.z.string().min(1).max(send_message_dto_1.MESSAGE_TEXT_MAX_LENGTH).describe('Reply text content'),
                mentions: mentionsSchema,
            }),
            handler: input => message.reply(input.sessionId, {
                chatId: input.chatId,
                quotedMessageId: input.quotedMessageId,
                text: input.text,
                mentions: input.mentions,
            }),
        }),
        (0, tool_descriptor_1.defineTool)({
            name: 'MessageForward',
            chatScope: ['fromChatId', 'toChatId'],
            description: 'Forward a message from one chat to another. Requires OPERATOR role.',
            tier: 'write',
            requiredRole: api_key_entity_1.ApiKeyRole.OPERATOR,
            sessionScoped: true,
            inputSchema: zod_1.z.object({
                sessionId,
                fromChatId: chat_id_schema_1.chatJidSchema.describe('Source chat JID'),
                toChatId: chat_id_schema_1.chatJidSchema.describe('Destination chat JID'),
                messageId: zod_1.z.string().min(1).describe('ID of the message to forward'),
            }),
            handler: input => message.forward(input.sessionId, {
                fromChatId: input.fromChatId,
                toChatId: input.toChatId,
                messageId: input.messageId,
            }),
        }),
        (0, tool_descriptor_1.defineTool)({
            name: 'MessageReact',
            chatScope: ['chatId'],
            description: 'Add or remove a reaction emoji on a message. Send empty string emoji to remove. Requires OPERATOR role.',
            tier: 'write',
            requiredRole: api_key_entity_1.ApiKeyRole.OPERATOR,
            sessionScoped: true,
            inputSchema: zod_1.z.object({
                sessionId,
                chatId: chat_id_schema_1.chatJidSchema.describe('Chat JID containing the message'),
                messageId: zod_1.z.string().min(1).describe('ID of the message to react to'),
                emoji: zod_1.z
                    .string()
                    .max(message_actions_dto_1.REACTION_EMOJI_MAX_LENGTH)
                    .describe('Emoji to react with. Empty string removes the reaction.'),
            }),
            handler: input => message
                .reactToMessage(input.sessionId, { chatId: input.chatId, messageId: input.messageId, emoji: input.emoji })
                .then(() => ({ success: true })),
        }),
    ];
}
//# sourceMappingURL=message.tools.js.map