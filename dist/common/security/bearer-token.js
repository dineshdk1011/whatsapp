"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bearerToken = bearerToken;
exports.presentedApiKey = presentedApiKey;
function bearerToken(header) {
    return header ? /^bearer\s+(\S+)\s*$/i.exec(header)?.[1] : undefined;
}
function presentedApiKey(headers) {
    const first = (value) => (Array.isArray(value) ? value[0] : value);
    return first(headers['x-api-key']) || bearerToken(first(headers.authorization));
}
//# sourceMappingURL=bearer-token.js.map