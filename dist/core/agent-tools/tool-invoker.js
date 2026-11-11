"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invokeTool = invokeTool;
const common_1 = require("@nestjs/common");
const zod_1 = require("zod");
const no_nul_character_1 = require("../../common/validation/no-nul-character");
async function invokeTool(tool, rawInput, rawKey, authService, onAuthenticated, onAuthFailure, chatScope, signal) {
    let apiKey;
    try {
        if (!rawKey) {
            throw new common_1.UnauthorizedException('Missing API key');
        }
        const probe = (rawInput ?? {});
        const sessionId = tool.sessionScoped && typeof probe.sessionId === 'string' ? probe.sessionId : undefined;
        if (tool.sessionScoped && !sessionId) {
            throw new common_1.BadRequestException('sessionId is required for this tool');
        }
        apiKey = await authService.validateApiKey(rawKey, undefined, sessionId);
        onAuthenticated?.(apiKey.id);
        if (tool.requiredRole && !authService.hasPermission(apiKey, tool.requiredRole)) {
            throw new common_1.ForbiddenException('API key lacks the required role');
        }
        if ((apiKey.allowedChats?.length ?? 0) > 0 && (!tool.chatScope || !chatScope)) {
            throw new common_1.ForbiddenException('API key is restricted to selected chats');
        }
    }
    catch (error) {
        onAuthFailure?.(error);
        throw error;
    }
    let input;
    try {
        input = tool.inputSchema.parse(rawInput);
    }
    catch (e) {
        if (e instanceof zod_1.ZodError) {
            throw new common_1.BadRequestException(e.issues.map(i => `${i.path.join('.') || '(root)'}: ${i.message}`));
        }
        throw e;
    }
    if ((0, no_nul_character_1.containsNul)(input))
        throw new common_1.BadRequestException('Tool input must not contain a NUL character');
    if (chatScope?.isRestricted(apiKey)) {
        try {
            const values = input !== null && typeof input === 'object' ? input : {};
            if (typeof tool.chatScope !== 'string') {
                const fields = tool.chatScope ?? [];
                if (fields.length === 0)
                    throw new common_1.ForbiddenException('API key is restricted to selected chats');
                for (const field of fields) {
                    const chatId = values[field];
                    if (typeof chatId !== 'string' || !chatId.trim()) {
                        throw new common_1.ForbiddenException(`${field} is required for a key restricted to selected chats`);
                    }
                    if (!(await chatScope.allows(apiKey, chatId))) {
                        throw new common_1.ForbiddenException('API key not authorized for this chat');
                    }
                }
            }
            const quote = values.quotedMessageId;
            if (!tool.chatQuotedAllowed && quote !== undefined && quote !== null && quote !== '') {
                throw new common_1.ForbiddenException('API key is restricted to selected chats');
            }
        }
        catch (error) {
            onAuthFailure?.(error);
            throw error;
        }
    }
    return tool.handler(input, apiKey, chatScope, signal);
}
//# sourceMappingURL=tool-invoker.js.map