"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentApiKey = exports.ChatQuotedAllowed = exports.ChatScoped = exports.RequireUnscopedKey = exports.Public = exports.SessionScoped = exports.RequireRole = exports.CHAT_QUOTED_ALLOWED_KEY = exports.CHAT_SCOPED_KEY = exports.UNSCOPED_KEY = exports.SESSION_SCOPED_KEY = exports.PUBLIC_KEY = exports.REQUIRED_ROLE_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.REQUIRED_ROLE_KEY = 'requiredRole';
exports.PUBLIC_KEY = 'isPublic';
exports.SESSION_SCOPED_KEY = 'sessionScoped';
exports.UNSCOPED_KEY = 'requireUnscopedKey';
exports.CHAT_SCOPED_KEY = 'chatScoped';
exports.CHAT_QUOTED_ALLOWED_KEY = 'chatQuotedAllowed';
const RequireRole = (role) => (0, common_1.SetMetadata)(exports.REQUIRED_ROLE_KEY, role);
exports.RequireRole = RequireRole;
const SessionScoped = () => (0, common_1.SetMetadata)(exports.SESSION_SCOPED_KEY, true);
exports.SessionScoped = SessionScoped;
const Public = () => (0, common_1.SetMetadata)(exports.PUBLIC_KEY, true);
exports.Public = Public;
const RequireUnscopedKey = () => (0, common_1.SetMetadata)(exports.UNSCOPED_KEY, true);
exports.RequireUnscopedKey = RequireUnscopedKey;
const ChatScoped = (kind) => (0, common_1.SetMetadata)(exports.CHAT_SCOPED_KEY, kind);
exports.ChatScoped = ChatScoped;
const ChatQuotedAllowed = () => (0, common_1.SetMetadata)(exports.CHAT_QUOTED_ALLOWED_KEY, true);
exports.ChatQuotedAllowed = ChatQuotedAllowed;
exports.CurrentApiKey = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.apiKey;
});
//# sourceMappingURL=auth.decorators.js.map