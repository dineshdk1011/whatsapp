"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contactTools = contactTools;
const zod_1 = require("zod");
const api_key_entity_1 = require("../../../modules/auth/entities/api-key.entity");
const tool_descriptor_1 = require("../tool-descriptor");
const paginate_1 = require("../../../common/utils/paginate");
const sessionId = zod_1.z.string().min(1).describe('Session UUID (the session id, not the name)');
function contactTools(contact) {
    return [
        (0, tool_descriptor_1.defineTool)({
            name: 'ContactFindAll',
            chatScope: 'filtered',
            description: 'List all contacts for a session. Use limit/offset to page through large contact lists.',
            tier: 'read',
            sessionScoped: true,
            inputSchema: zod_1.z.object({
                sessionId,
                limit: zod_1.z.number().int().min(1).max(1000).optional(),
                offset: zod_1.z.number().int().min(0).optional(),
            }),
            handler: async (input, apiKey, chatScope) => {
                if (!chatScope?.isRestricted(apiKey)) {
                    return contact.getContacts(input.sessionId, { limit: input.limit, offset: input.offset });
                }
                const visible = await chatScope.filter(apiKey, await contact.listContacts(input.sessionId, input.offset), item => item.id);
                return (0, paginate_1.paginate)(visible, input.limit, input.offset);
            },
        }),
        (0, tool_descriptor_1.defineTool)({
            name: 'ContactFindOne',
            chatScope: ['contactId'],
            description: 'Get details for a specific contact by JID (e.g. 628xxx@c.us).',
            tier: 'read',
            sessionScoped: true,
            inputSchema: zod_1.z.object({
                sessionId,
                contactId: zod_1.z.string().min(1).describe('Contact JID (e.g. 628123456789@c.us)'),
            }),
            handler: input => contact.getContactById(input.sessionId, input.contactId),
        }),
        (0, tool_descriptor_1.defineTool)({
            name: 'ContactCheckNumber',
            description: 'Check whether a phone number is registered on WhatsApp. Returns exists flag and the WhatsApp JID if found. Requires OPERATOR role.',
            tier: 'read',
            requiredRole: api_key_entity_1.ApiKeyRole.OPERATOR,
            sessionScoped: true,
            inputSchema: zod_1.z.object({
                sessionId,
                number: zod_1.z.string().min(1).describe('Phone number to check (e.g. 628123456789, digits only)'),
            }),
            handler: async (input) => {
                const whatsappId = await contact.getNumberId(input.sessionId, input.number);
                return { number: input.number, exists: whatsappId !== null, whatsappId };
            },
        }),
        (0, tool_descriptor_1.defineTool)({
            name: 'ContactResolvePhone',
            chatScope: ['contactId'],
            description: 'Resolve a contact JID (e.g. an @lid) to a phone number. Best-effort — returns null when the engine cannot map it.',
            tier: 'read',
            sessionScoped: true,
            inputSchema: zod_1.z.object({
                sessionId,
                contactId: zod_1.z.string().min(1).describe('Contact JID to resolve (e.g. an @lid)'),
            }),
            handler: async (input) => {
                const phone = await contact.resolveContactPhone(input.sessionId, input.contactId);
                return { contactId: input.contactId, phone };
            },
        }),
        (0, tool_descriptor_1.defineTool)({
            name: 'ContactGetProfilePicture',
            chatScope: ['contactId'],
            description: 'Get the profile picture URL for a contact.',
            tier: 'read',
            sessionScoped: true,
            inputSchema: zod_1.z.object({
                sessionId,
                contactId: zod_1.z.string().min(1).describe('Contact JID (e.g. 628123456789@c.us)'),
            }),
            handler: async (input) => {
                const url = await contact.getProfilePicture(input.sessionId, input.contactId);
                return { url };
            },
        }),
        (0, tool_descriptor_1.defineTool)({
            name: 'ContactBlock',
            chatScope: ['contactId'],
            description: 'Block a contact. The contact will no longer be able to send messages. Requires OPERATOR role.',
            tier: 'write',
            requiredRole: api_key_entity_1.ApiKeyRole.OPERATOR,
            sessionScoped: true,
            inputSchema: zod_1.z.object({
                sessionId,
                contactId: zod_1.z.string().min(1).describe('Contact JID (e.g. 628123456789@c.us)'),
            }),
            handler: async (input) => {
                await contact.blockContact(input.sessionId, input.contactId);
                return { success: true, message: 'Contact blocked' };
            },
        }),
        (0, tool_descriptor_1.defineTool)({
            name: 'ContactUnblock',
            chatScope: ['contactId'],
            description: 'Unblock a previously blocked contact. Requires OPERATOR role.',
            tier: 'write',
            requiredRole: api_key_entity_1.ApiKeyRole.OPERATOR,
            sessionScoped: true,
            inputSchema: zod_1.z.object({
                sessionId,
                contactId: zod_1.z.string().min(1).describe('Contact JID (e.g. 628123456789@c.us)'),
            }),
            handler: async (input) => {
                await contact.unblockContact(input.sessionId, input.contactId);
                return { success: true, message: 'Contact unblocked' };
            },
        }),
    ];
}
//# sourceMappingURL=contact.tools.js.map