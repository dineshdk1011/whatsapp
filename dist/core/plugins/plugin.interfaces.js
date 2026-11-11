"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginCapabilityError = exports.SUPPORTED_SDK_MAJOR = exports.PluginCapabilityPermission = exports.PluginStatus = exports.PluginType = void 0;
exports.validateIngressManifest = validateIngressManifest;
exports.warnUnauthenticatedIngressRoutes = warnUnauthenticatedIngressRoutes;
exports.warnUnsignedTimestampRoutes = warnUnsignedTimestampRoutes;
var PluginType;
(function (PluginType) {
    PluginType["ENGINE"] = "engine";
    PluginType["STORAGE"] = "storage";
    PluginType["QUEUE"] = "queue";
    PluginType["AUTH"] = "auth";
    PluginType["EXTENSION"] = "extension";
})(PluginType || (exports.PluginType = PluginType = {}));
var PluginStatus;
(function (PluginStatus) {
    PluginStatus["INSTALLED"] = "installed";
    PluginStatus["ENABLED"] = "enabled";
    PluginStatus["DISABLED"] = "disabled";
    PluginStatus["ERROR"] = "error";
})(PluginStatus || (exports.PluginStatus = PluginStatus = {}));
exports.PluginCapabilityPermission = {
    MESSAGES_SEND: 'messages:send',
    ENGINE_READ: 'engine:read',
    NET_FETCH: 'net:fetch',
    STORAGE_USE: 'storage:use',
    WEBHOOK_INGRESS: 'webhook:ingress',
    CONVERSATION_SEND: 'conversation:send',
    SEARCH_PROVIDE: 'search:provide',
};
const INGRESS_SIGNATURE_SCHEMES = [
    'hmac-sha256',
    'shared-secret',
    'standard-webhooks',
    'none',
];
exports.SUPPORTED_SDK_MAJOR = 1;
const HTTP_HEADER_NAME = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
const HTTP_HEADER_VALUE = /^[\t\x20-\x7e\x80-\xff]*$/;
const INGRESS_ROUTE_SEGMENT = /^[^/\\?#%\x00-\x1f\x7f\p{Cs}]+$/u;
function validateIngressManifest(manifest, allowUnsignedIngress = false) {
    if (!manifest.ingress?.length)
        return;
    const declaredMajor = Number.parseInt((manifest.sdkVersion ?? '1').split('.')[0], 10);
    if (!Number.isFinite(declaredMajor) || declaredMajor !== exports.SUPPORTED_SDK_MAJOR) {
        throw new Error(`Plugin ${manifest.id}: SDK major ${manifest.sdkVersion} is not supported by this host (supports ${exports.SUPPORTED_SDK_MAJOR})`);
    }
    const perms = manifest.permissions ?? [];
    if (!perms.includes(exports.PluginCapabilityPermission.WEBHOOK_INGRESS)) {
        throw new Error(`Plugin ${manifest.id}: declares ingress routes but is missing the 'webhook:ingress' permission. ` +
            `Add "webhook:ingress" to the "permissions" array in the plugin's manifest.json.`);
    }
    const seen = new Set();
    for (const r of manifest.ingress) {
        if (!r.route || seen.has(r.route)) {
            throw new Error(`Plugin ${manifest.id}: duplicate or empty ingress route '${r.route}'`);
        }
        seen.add(r.route);
        if (typeof r.route !== 'string' || !INGRESS_ROUTE_SEGMENT.test(r.route) || r.route === '.' || r.route === '..') {
            throw new Error(`Plugin ${manifest.id}: ingress route '${String(r.route)}' must be a single URL path segment ` +
                `(no '/', '\\', '?', '#', '%', control character or lone surrogate, and not '.' or '..')`);
        }
        const signature = r.signature && typeof r.signature === 'object' ? r.signature : undefined;
        if (!signature?.scheme || !INGRESS_SIGNATURE_SCHEMES.includes(signature.scheme)) {
            throw new Error(`Plugin ${manifest.id}: route '${r.route}' signature.scheme must be one of ` +
                `${INGRESS_SIGNATURE_SCHEMES.join(', ')} (got '${String(signature?.scheme)}')`);
        }
        if (signature.scheme === 'hmac-sha256' &&
            signature.encoding !== undefined &&
            signature.encoding !== 'hex' &&
            signature.encoding !== 'base64') {
            throw new Error(`Plugin ${manifest.id}: route '${r.route}' signature.encoding must be 'hex' or 'base64' ` +
                `(got '${String(signature.encoding)}')`);
        }
        if (r.signature.scheme === 'none' && !allowUnsignedIngress) {
            throw new Error(`Plugin ${manifest.id}: ingress route '${r.route}' declares signature.scheme 'none', which is an ` +
                `unauthenticated public endpoint that can trigger WhatsApp sends. Set ALLOW_UNSIGNED_INGRESS=true to ` +
                `opt in (and front the route with a network/reverse-proxy ACL).`);
        }
        const tol = r.signature.toleranceSec;
        if (tol !== undefined) {
            const n = typeof tol === 'number' ? tol : typeof tol === 'string' && tol.trim() !== '' ? Number(tol) : Number.NaN;
            if (!Number.isFinite(n) || n <= 0) {
                throw new Error(`Plugin ${manifest.id}: route '${r.route}' toleranceSec must be a positive number of seconds ` +
                    `(a replay guard would be a no-op)`);
            }
        }
        if (r.dedupOn !== undefined && r.dedupOn !== 'header' && r.dedupOn !== 'body') {
            throw new Error(`Plugin ${manifest.id}: route '${r.route}' dedupOn must be 'header' or 'body' (got '${String(r.dedupOn)}')`);
        }
        if (r.response) {
            const ackStatus = r.response.ack?.status;
            if (ackStatus !== undefined && (!Number.isInteger(ackStatus) || ackStatus < 200 || ackStatus > 599)) {
                throw new Error(`Plugin ${manifest.id}: route '${r.route}' response.ack.status must be a final HTTP status (200-599)`);
            }
            const ackBody = r.response.ack?.body;
            if (ackBody !== undefined && typeof ackBody !== 'string') {
                throw new Error(`Plugin ${manifest.id}: route '${r.route}' response.ack.body must be a string`);
            }
            if (r.response.ack?.headers) {
                for (const [name, value] of Object.entries(r.response.ack.headers)) {
                    if (!HTTP_HEADER_NAME.test(name)) {
                        throw new Error(`Plugin ${manifest.id}: route '${r.route}' response.ack header name '${name}' is not a valid HTTP token`);
                    }
                    if (typeof value !== 'string') {
                        throw new Error(`Plugin ${manifest.id}: route '${r.route}' response.ack header '${name}' must be a string`);
                    }
                    if (!HTTP_HEADER_VALUE.test(value)) {
                        throw new Error(`Plugin ${manifest.id}: route '${r.route}' response.ack header '${name}' has invalid characters ` +
                            `(control characters and characters above U+00FF cannot be written in a header)`);
                    }
                }
            }
        }
    }
}
function warnUnauthenticatedIngressRoutes(manifest, logger) {
    for (const r of manifest.ingress ?? []) {
        if (r.signature.scheme === 'none') {
            logger.warn(`Ingress route '${r.route}' of plugin '${manifest.id}' uses signature scheme 'none' — it is an ` +
                `UNAUTHENTICATED public endpoint that can trigger WhatsApp sends. Only keep this if the provider ` +
                `offers no HMAC and the URL is guarded by a network/reverse-proxy ACL.`, { pluginId: manifest.id, route: r.route, action: 'ingress_unauthenticated_route' });
        }
    }
}
function warnUnsignedTimestampRoutes(manifest, logger) {
    for (const r of manifest.ingress ?? []) {
        if (r.signature.scheme === 'shared-secret' && r.dedupOn !== 'body') {
            logger.warn(`Ingress route '${r.route}' of plugin '${manifest.id}' uses scheme 'shared-secret', which binds ` +
                `neither the body nor a timestamp, and dedups on a header the secret does not cover: a copy of a ` +
                `delivery sent with a different header value is accepted as new. Prefer an hmac-sha256 scheme ` +
                `with a signed timestamp, or set dedupOn: 'body' if the provider's retries are byte-identical.`, { pluginId: manifest.id, route: r.route, action: 'ingress_replayable_route' });
            continue;
        }
        if (r.signature.scheme !== 'hmac-sha256')
            continue;
        const signsTimestamp = (r.signature.contentTemplate ?? '{rawBody}').includes('{timestamp}');
        if (r.signature.timestampHeader && !signsTimestamp) {
            logger.warn(`Ingress route '${r.route}' of plugin '${manifest.id}' declares timestampHeader ` +
                `'${r.signature.timestampHeader}' but its contentTemplate does not sign it — the timestamp is ` +
                `freshness-checked but UNSIGNED, so a replayed body can mint a fresh timestamp. Include ` +
                `{timestamp} in the contentTemplate (e.g. '{timestamp}.{rawBody}') to bind it.`, { pluginId: manifest.id, route: r.route, action: 'ingress_unsigned_timestamp' });
        }
        else if (!r.signature.timestampHeader && signsTimestamp) {
            logger.warn(`Ingress route '${r.route}' of plugin '${manifest.id}' signs a {timestamp} token but declares no ` +
                `timestampHeader — the token binds the empty string and no freshness check runs. Declare the ` +
                `provider's timestamp header (and optionally toleranceSec) to activate the replay window.`, { pluginId: manifest.id, route: r.route, action: 'ingress_unsigned_timestamp' });
        }
        else if (!r.signature.timestampHeader && r.dedupOn !== 'body') {
            logger.warn(`Ingress route '${r.route}' of plugin '${manifest.id}' signs no timestamp and dedups on a header ` +
                `the signature does not cover: a copy of a delivery sent with a different header value is ` +
                `accepted as new. Declare and sign the provider's timestamp (timestampHeader plus {timestamp} ` +
                `in the contentTemplate), or set dedupOn: 'body' if the provider's retries are byte-identical.`, { pluginId: manifest.id, route: r.route, action: 'ingress_replayable_route' });
        }
    }
}
class PluginCapabilityError extends Error {
    constructor(message) {
        super(message);
        this.name = 'PluginCapabilityError';
    }
}
exports.PluginCapabilityError = PluginCapabilityError;
//# sourceMappingURL=plugin.interfaces.js.map