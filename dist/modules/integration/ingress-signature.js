"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveIngressTimestampToleranceSec = resolveIngressTimestampToleranceSec;
exports.verifyIngressSignature = verifyIngressSignature;
const node_crypto_1 = require("node:crypto");
const constantTimeEqual_1 = require("../../common/security/constantTimeEqual");
function resolveIngressTimestampToleranceSec(env = process.env) {
    const parsed = Number(env.INGRESS_TIMESTAMP_TOLERANCE_SEC);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 300;
}
function header(headers, name) {
    if (!name)
        return undefined;
    return headers[name.toLowerCase()];
}
function parseWebhookSecret(secret) {
    let s = secret.trim();
    if (s.startsWith('v1,'))
        s = s.slice(3);
    if (s.startsWith('whsec_'))
        s = s.slice(6);
    return s.length > 0 ? s : undefined;
}
function verifyStandardWebhooks(spec, input) {
    const keyB64 = parseWebhookSecret(input.secret);
    if (!keyB64)
        return { ok: false, reason: 'empty standard-webhooks secret' };
    const key = Buffer.from(keyB64, 'base64');
    if (key.length === 0)
        return { ok: false, reason: 'standard-webhooks secret decodes to empty key' };
    const id = header(input.headers, 'webhook-id');
    const tsRaw = header(input.headers, 'webhook-timestamp');
    const sigHeader = header(input.headers, 'webhook-signature');
    if (!id || !tsRaw || !sigHeader) {
        return { ok: false, reason: 'missing webhook-id/webhook-timestamp/webhook-signature header' };
    }
    const ts = Number.parseInt(tsRaw, 10);
    if (!Number.isFinite(ts))
        return { ok: false, reason: 'invalid webhook-timestamp' };
    const tolerance = spec.toleranceSec ?? resolveIngressTimestampToleranceSec();
    const skewSec = Math.abs(input.now / 1000 - ts);
    if (skewSec > tolerance)
        return { ok: false, reason: 'replay: timestamp outside tolerance' };
    const signed = `${id}.${tsRaw}.${input.rawBody}`;
    const expected = (0, node_crypto_1.createHmac)('sha256', key).update(signed).digest('base64');
    for (const candidate of sigHeader.split(' ')) {
        const comma = candidate.indexOf(',');
        if (comma < 0)
            continue;
        if (candidate.slice(0, comma) !== 'v1')
            continue;
        if ((0, constantTimeEqual_1.constantTimeEqual)(candidate.slice(comma + 1), expected))
            return { ok: true };
    }
    return { ok: false, reason: 'webhook-signature mismatch' };
}
function verifyIngressSignature(spec, input) {
    if (spec.scheme === 'none')
        return { ok: true };
    if (!input.secret)
        return { ok: false, reason: 'empty ingress secret' };
    if (spec.scheme === 'standard-webhooks')
        return verifyStandardWebhooks(spec, input);
    if (spec.timestampHeader) {
        const tsRaw = header(input.headers, spec.timestampHeader);
        const ts = Number.parseInt(tsRaw ?? '', 10);
        if (!Number.isFinite(ts))
            return { ok: false, reason: 'missing/invalid timestamp' };
        const toleranceSec = spec.toleranceSec ?? resolveIngressTimestampToleranceSec();
        const skewSec = Math.abs(input.now / 1000 - ts);
        if (skewSec > toleranceSec) {
            return { ok: false, reason: 'replay: timestamp outside tolerance' };
        }
    }
    const provided = header(input.headers, spec.header);
    if (!provided)
        return { ok: false, reason: 'missing signature header' };
    if (spec.scheme === 'shared-secret') {
        return (0, constantTimeEqual_1.constantTimeEqual)(provided, input.secret) ? { ok: true } : { ok: false, reason: 'shared-secret mismatch' };
    }
    const template = spec.contentTemplate ?? '{rawBody}';
    const timestamp = header(input.headers, spec.timestampHeader) ?? '';
    const signedContent = template.replace(/\{rawBody\}|\{timestamp\}|\{id\}/g, token => token === '{rawBody}' ? input.rawBody : token === '{timestamp}' ? timestamp : input.instanceId);
    const digest = (0, node_crypto_1.createHmac)('sha256', input.secret)
        .update(signedContent)
        .digest(spec.encoding ?? 'hex');
    const expected = (spec.prefix ?? '') + digest;
    return (0, constantTimeEqual_1.constantTimeEqual)(provided, expected) ? { ok: true } : { ok: false, reason: 'hmac mismatch' };
}
//# sourceMappingURL=ingress-signature.js.map