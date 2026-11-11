"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderAck = renderAck;
exports.safeAckHeaders = safeAckHeaders;
exports.ackContentType = ackContentType;
function renderAck(spec, ctx) {
    if (!spec)
        return { status: 202, body: 'accepted' };
    const result = { status: typeof spec.status === 'number' ? spec.status : 202 };
    if (typeof spec.body === 'string') {
        result.body = substitute(spec.body, ctx);
    }
    if (spec.headers && typeof spec.headers === 'object') {
        result.headers = Object.fromEntries(Object.entries(spec.headers).filter(([, v]) => typeof v === 'string'));
    }
    return result;
}
const RESERVED_ACK_HEADERS = new Set([
    'content-type',
    'content-length',
    'transfer-encoding',
    'content-encoding',
    'trailer',
    'content-security-policy',
    'x-content-type-options',
    'x-frame-options',
    'strict-transport-security',
    'referrer-policy',
    'set-cookie',
    'access-control-allow-origin',
    'access-control-allow-credentials',
]);
function safeAckHeaders(headers) {
    if (!headers)
        return {};
    return Object.fromEntries(Object.entries(headers).filter(([name, value]) => typeof value === 'string' && !RESERVED_ACK_HEADERS.has(name.toLowerCase())));
}
const HONORED_ACK_MEDIA_TYPES = new Set(['application/json', 'text/plain']);
function ackContentType(headers) {
    const declared = headers
        ? Object.entries(headers).find(([name]) => name.toLowerCase() === 'content-type')?.[1]
        : undefined;
    if (typeof declared !== 'string' || !declared)
        return 'text/plain';
    const mediaType = declared.split(';', 1)[0].trim().toLowerCase();
    return HONORED_ACK_MEDIA_TYPES.has(mediaType) ? mediaType : 'text/plain';
}
function substitute(template, ctx) {
    return template.replace(/\{(rawBody|timestamp|id)\}/g, (_, key) => ctx[key]);
}
//# sourceMappingURL=ingress-ack.js.map