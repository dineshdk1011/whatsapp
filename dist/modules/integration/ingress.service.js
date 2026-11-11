"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngressService = void 0;
exports.extractConversationId = extractConversationId;
exports.redactSensitiveHeaders = redactSensitiveHeaders;
const node_crypto_1 = require("node:crypto");
const throttler_1 = require("@nestjs/throttler");
const ingress_signature_1 = require("./ingress-signature");
const constantTimeEqual_1 = require("../../common/security/constantTimeEqual");
const ingress_preflight_1 = require("./ingress-preflight");
const ingress_ack_1 = require("./ingress-ack");
const inflight_body_budget_1 = require("../../config/inflight-body-budget");
const bootstrap_security_1 = require("../../config/bootstrap-security");
const logger_service_1 = require("../../common/services/logger.service");
class IngressService {
    deps;
    logger = (0, logger_service_1.createLogger)('IngressService');
    constructor(deps) {
        this.deps = deps;
    }
    warnedMissingCap = new Set();
    fallbackMaxBodyBytes(pluginId, route) {
        const key = `${pluginId}:${route}`;
        if (!this.warnedMissingCap.has(key)) {
            this.warnedMissingCap.add(key);
            this.logger.warn(`Ingress route ${key} declares no usable maxBodyBytes; falling back to the process body limit. ` +
                'Set a per-route maxBodyBytes in the plugin manifest.');
        }
        return (0, inflight_body_budget_1.parseBodyLimitBytes)((0, bootstrap_security_1.resolveBodyLimit)(process.env.BODY_SIZE_LIMIT));
    }
    async handle(req) {
        const instance = await this.deps.instances.resolve(req.pluginId, req.instanceId);
        if (!instance || !instance.enabled)
            return { status: 404, body: 'unknown instance' };
        const route = this.deps.manifestRoute(req.pluginId, req.route);
        if (!route)
            return { status: 404, body: 'unknown route' };
        if (req.method === 'GET' && route.challenge) {
            const token = req.query[route.challenge.tokenParam];
            const echo = req.query[route.challenge.echoParam];
            if (token && instance.verifyToken && (0, constantTimeEqual_1.constantTimeEqual)(token, instance.verifyToken)) {
                return { status: 200, body: echo ?? '' };
            }
            return { status: 403, body: 'challenge failed' };
        }
        if (req.unparsedBody)
            return { status: 415, body: 'unsupported ingress content type' };
        const declaredCap = route.maxBodyBytes;
        const parsedCap = typeof declaredCap === 'number'
            ? declaredCap
            : typeof declaredCap === 'string' && declaredCap.trim() !== ''
                ? Number(declaredCap)
                : Number.NaN;
        const effectiveCap = Number.isFinite(parsedCap) && parsedCap >= 0 ? parsedCap : this.fallbackMaxBodyBytes(req.pluginId, route.route);
        if (Buffer.byteLength(req.rawBody, 'utf8') > effectiveCap)
            return { status: 413, body: 'payload too large' };
        const verdict = (0, ingress_signature_1.verifyIngressSignature)(route.signature, {
            rawBody: req.rawBody,
            headers: req.headers,
            secret: instance.secret,
            now: this.deps.now(),
            instanceId: req.instanceId,
        });
        if (!verdict.ok)
            return { status: 401, body: verdict.reason ?? 'signature verification failed' };
        const admission = this.deps.admitInstance ? await this.deps.admitInstance(req.pluginId, req.instanceId) : undefined;
        if (admission && !admission.ok) {
            return {
                status: 429,
                body: JSON.stringify({ statusCode: 429, message: throttler_1.throttlerMessage }),
                headers: { 'content-type': 'application/json', ...admission.headers },
            };
        }
        const preflight = route.response && this.deps.restorePending?.(req.pluginId)
            ? (0, ingress_preflight_1.pluginRestoringRejection)()
            : (0, ingress_preflight_1.evaluatePreflight)(route, instance.sessionScope, this.deps.sessionStatus);
        if (preflight) {
            this.deps.log?.('ingress_preflight_rejected', {
                pluginId: req.pluginId,
                instanceId: req.instanceId,
                route: req.route,
                status: preflight.status,
                reason: preflight.body,
                sessionScope: instance.sessionScope,
            });
            return preflight;
        }
        const defaultDedupHeader = route.signature.scheme === 'standard-webhooks' ? 'webhook-id' : 'x-delivery';
        const dedupHeader = (route.dedupHeader ?? route.signature.dedupHeader ?? defaultDedupHeader).toLowerCase();
        const headerId = req.headers[dedupHeader]?.trim();
        const deliveryId = route.dedupOn === 'body' || !headerId || headerId.length > MAX_DELIVERY_ID_LENGTH
            ? deriveDeliveryId(req)
            : headerId;
        const payload = {
            admission: { verified: route.signature.scheme !== 'none' },
            headers: redactSensitiveHeaders(req.headers, route.signature.scheme === 'shared-secret' || route.signature.scheme === 'hmac-sha256'
                ? route.signature.header
                : undefined),
            query: req.query,
            body: req.rawBody,
            rawBody: req.rawBody,
        };
        const rendered = (0, ingress_ack_1.renderAck)(route.response?.ack, {
            rawBody: req.rawBody,
            timestamp: String(Math.floor(this.deps.now() / 1000)),
            id: deliveryId,
        });
        const ack = admission ? { ...rendered, headers: { ...rendered.headers, ...admission.headers } } : rendered;
        const isNew = await this.deps.events.recordOrSkip({
            instanceId: req.instanceId,
            pluginId: req.pluginId,
            providerDeliveryId: deliveryId,
            route: req.route,
            payload: { ...payload, method: req.method },
            payloadHash: (0, node_crypto_1.createHash)('sha256').update(req.rawBody).digest('hex'),
            sessionId: instance.sessionScope,
        });
        if (!isNew)
            return ack;
        if (this.deps.deferDispatch?.(req.pluginId))
            return ack;
        const providerConversationId = extractConversationId(route.conversationId, req.headers, req.rawBody);
        const jobData = {
            pluginId: req.pluginId,
            instanceId: req.instanceId,
            route: req.route,
            method: req.method,
            deliveryId,
            sessionId: instance.sessionScope ?? undefined,
            providerConversationId,
            payload,
        };
        if (route.response) {
            void this.deps.enqueue(jobData, deliveryId).catch(err => {
                this.deps.log?.('ingress_enqueue_unhandled', {
                    pluginId: req.pluginId,
                    instanceId: req.instanceId,
                    deliveryId,
                    error: err instanceof Error ? err.message : String(err),
                });
            });
        }
        else {
            await this.deps.enqueue(jobData, deliveryId);
        }
        return ack;
    }
}
exports.IngressService = IngressService;
const MAX_DELIVERY_ID_LENGTH = 255;
function deriveDeliveryId(req) {
    const parts = [req.pluginId, req.instanceId, req.route, req.rawBody];
    const query = Object.entries(req.query).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    if (req.rawBody === '' && query.length > 0)
        parts.push(req.method, JSON.stringify(query));
    return (0, node_crypto_1.createHash)('sha256').update(parts.join('\0')).digest('hex');
}
function extractConversationId(spec, headers, rawBody) {
    if (!spec)
        return undefined;
    if (spec.header) {
        const v = headers[spec.header.toLowerCase()];
        if (v)
            return v;
    }
    if (spec.jsonPointer) {
        try {
            let node = JSON.parse(rawBody);
            const path = spec.jsonPointer.startsWith('/') ? spec.jsonPointer.slice(1) : spec.jsonPointer;
            for (const token of path.split('/')) {
                if (/~(?:[^01]|$)/.test(token))
                    return undefined;
                const key = token.replace(/~1/g, '/').replace(/~0/g, '~');
                if (node === null || typeof node !== 'object' || !Object.hasOwn(node, key))
                    return undefined;
                if (Array.isArray(node) && !/^(0|[1-9][0-9]*)$/.test(key))
                    return undefined;
                node = node[key];
            }
            if (typeof node === 'string')
                return node;
            if (typeof node === 'number' || typeof node === 'boolean')
                return String(node);
        }
        catch {
            return undefined;
        }
    }
    return undefined;
}
const SENSITIVE_INGRESS_HEADERS = new Set([
    'authorization',
    'proxy-authorization',
    'cookie',
    'x-hub-signature',
    'x-hub-signature-256',
    'x-signature',
    'x-signature-ed25519',
    'x-webhook-signature',
    'webhook-signature',
]);
function redactSensitiveHeaders(headers, credentialHeader) {
    const extra = credentialHeader?.toLowerCase();
    const out = {};
    for (const [name, value] of Object.entries(headers)) {
        const lower = name.toLowerCase();
        out[name] = SENSITIVE_INGRESS_HEADERS.has(lower) || lower === extra ? '[redacted]' : value;
    }
    return out;
}
//# sourceMappingURL=ingress.service.js.map