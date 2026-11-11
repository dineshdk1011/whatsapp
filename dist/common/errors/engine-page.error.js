"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecipientLookupUnansweredError = exports.EnginePageError = void 0;
const common_1 = require("@nestjs/common");
const FIELD_LIMIT = 200;
const cut = (text) => (text.length > FIELD_LIMIT ? `${text.slice(0, FIELD_LIMIT)}...` : text);
class EnginePageError extends common_1.InternalServerErrorException {
    constructor(summary, raw) {
        const name = cut(summary.name);
        const message = cut(summary.message);
        const build = summary.build ? cut(summary.build) : undefined;
        const reason = `${message ? `${name}: ${message}` : name}${build ? ` (build ${build})` : ''}`;
        super({
            statusCode: 500,
            error: 'Internal Server Error',
            code: 'ENGINE_PAGE_ERROR',
            message: `WhatsApp Web rejected the operation: ${reason}`,
            pageError: { name, message },
            ...(build ? { build } : {}),
        }, { cause: raw });
    }
}
exports.EnginePageError = EnginePageError;
class RecipientLookupUnansweredError extends EnginePageError {
}
exports.RecipientLookupUnansweredError = RecipientLookupUnansweredError;
//# sourceMappingURL=engine-page.error.js.map