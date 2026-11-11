"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchTools = searchTools;
const common_1 = require("@nestjs/common");
const zod_1 = require("zod");
const api_key_entity_1 = require("../../../modules/auth/entities/api-key.entity");
const message_entity_1 = require("../../../modules/message/entities/message.entity");
const search_constants_1 = require("../../../modules/search/search.constants");
const search_terms_1 = require("../../../modules/search/search-terms");
const chat_id_schema_1 = require("../chat-id-schema");
const tool_descriptor_1 = require("../tool-descriptor");
function searchTools(search, containsEnabled = false) {
    const defaultMatch = containsEnabled ? 'contains' : 'word';
    const matchHelp = containsEnabled
        ? `match=contains (the default) finds any part of a word, ignoring case and accents, and ranks the ${search_constants_1.SEARCH_CONTAINS_WINDOW} most recently stored matches (whole words first, then newest), so total is at most ${search_constants_1.SEARCH_CONTAINS_WINDOW}: narrow with more terms, chatId or dateTo to reach older ones. It needs a term of ${search_constants_1.SEARCH_CONTAINS_MIN_TERM_LENGTH} or more characters and at most ${search_constants_1.SEARCH_CONTAINS_TERMS_MAX_LENGTH} characters in all its terms; without match, a query outside those bounds runs as match=word, which finds whole words only.`
        : 'match=word (the default) finds whole words; match=contains needs SEARCH_CONTAINS_ENABLED=true on the server.';
    return [
        (0, tool_descriptor_1.defineTool)({
            name: 'MessageSearch',
            chatScope: ['chatId'],
            description: 'Search persisted messages across every session and chat the API key may read. Returns ranked hits with a <mark>-highlighted snippet, chatId, sender and timestamp; resolve names with SessionGetChats or ContactFindOne. ' +
                `${matchHelp} A key restricted to selected chats must pass chatId.`,
            tier: 'read',
            requiredRole: api_key_entity_1.ApiKeyRole.OPERATOR,
            inputSchema: zod_1.z.object({
                q: zod_1.z.string().trim().min(1).max(search_constants_1.SEARCH_QUERY_MAX_LENGTH).describe('Search term'),
                match: zod_1.z
                    .enum(search_constants_1.SEARCH_MATCH_MODES)
                    .optional()
                    .describe(`contains: any part of a word; word: whole words only. Default: ${defaultMatch}`),
                chatId: chat_id_schema_1.chatIdSchema.optional().describe('Restrict to a single chat JID'),
                from: zod_1.z.string().optional().describe('Filter by sender phone or JID'),
                direction: zod_1.z.enum(message_entity_1.MessageDirection).optional(),
                dateFrom: zod_1.z
                    .number()
                    .min(-Number.MAX_SAFE_INTEGER)
                    .max(Number.MAX_SAFE_INTEGER)
                    .optional()
                    .describe('Epoch-ms lower bound (inclusive)'),
                dateTo: zod_1.z
                    .number()
                    .min(-Number.MAX_SAFE_INTEGER)
                    .max(Number.MAX_SAFE_INTEGER)
                    .optional()
                    .describe('Epoch-ms upper bound (inclusive)'),
                limit: zod_1.z.number().int().min(1).max(search_constants_1.SEARCH_LIMIT_MAX).optional(),
                offset: zod_1.z.number().int().min(0).max(search_constants_1.SEARCH_OFFSET_MAX).optional(),
            }),
            handler: async (input, apiKey, chatScope) => {
                if (!search)
                    throw new common_1.NotImplementedException('Search is disabled (SEARCH_ENABLED=false).');
                const sessionIds = apiKey.allowedSessions ?? undefined;
                const chatIds = await chatScope?.idsForFilter(apiKey);
                try {
                    return await search.search({ ...input, match: input.match ?? defaultMatch }, sessionIds, chatIds);
                }
                catch (error) {
                    const fallback = error instanceof common_1.NotImplementedException || error instanceof search_terms_1.ContainsTermsRefusedError;
                    if (input.match || defaultMatch === 'word' || !fallback)
                        throw error;
                    return search.search({ ...input, match: 'word' }, sessionIds, chatIds);
                }
            },
        }),
    ];
}
//# sourceMappingURL=search.tools.js.map