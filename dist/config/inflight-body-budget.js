"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseBodyLimitBytes = parseBodyLimitBytes;
exports.resolveInflightBodyBudgetBytes = resolveInflightBodyBudgetBytes;
exports.createInflightBodyBudget = createInflightBodyBudget;
const bootstrap_security_1 = require("./bootstrap-security");
const ip_1 = require("../common/utils/ip");
const DEFAULT_BUDGET_MULTIPLIER = 4;
const UNIT_BYTES = {
    b: 1,
    kb: 1024,
    mb: 1024 ** 2,
    gb: 1024 ** 3,
    tb: 1024 ** 4,
    pb: 1024 ** 5,
};
const FALLBACK_LIMIT_BYTES = 25 * UNIT_BYTES.mb;
const STALL_TIMEOUT_MS = 15_000;
const STALL_POLL_MS = 5_000;
const DEFAULT_REQUEST_TIMEOUT_MS = 300_000;
const UNDECLARED_OPENING_RESERVATION_BYTES = 1024 * 1024;
function parseBodyLimitBytes(limit) {
    const match = /^(\d+(?:\.\d+)?)\s?(b|kb|mb|gb|tb|pb)?$/i.exec(limit.trim());
    if (!match)
        return FALLBACK_LIMIT_BYTES;
    return Math.floor(parseFloat(match[1]) * UNIT_BYTES[(match[2] ?? 'b').toLowerCase()]);
}
function resolveInflightBodyBudgetBytes(budgetEnv, bodyLimitEnv) {
    const raw = budgetEnv?.trim();
    if (raw) {
        const explicit = Number(raw);
        if (Number.isInteger(explicit) && explicit > 0)
            return explicit;
    }
    return DEFAULT_BUDGET_MULTIPLIER * parseBodyLimitBytes((0, bootstrap_security_1.resolveBodyLimit)(bodyLimitEnv));
}
const ANONYMOUS_POOL_FRACTION = 0.25;
function createInflightBodyBudget(budgetBytes, options) {
    let inFlightBytes = 0;
    const retryAfter = String(options?.retryAfterSeconds ?? 1);
    const trustedProxies = options?.trustedProxies ?? [];
    const share = Math.min(1, Math.max(Number.EPSILON, options?.perClientShare ?? 0.5));
    const perClientCap = Math.max(1, Math.floor(budgetBytes * share));
    const classify = options?.classify;
    const bodyLimitBytes = options?.bodyLimitBytes ?? FALLBACK_LIMIT_BYTES;
    const requestTimeoutMs = options?.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
    const anonPool = Math.min(budgetBytes, Math.max(2 * bodyLimitBytes, Math.floor(budgetBytes * ANONYMOUS_POOL_FRACTION)));
    const anonClientCap = Math.max(Math.min(bodyLimitBytes, anonPool), Math.floor(anonPool * share));
    let anonInFlight = 0;
    const clientInFlight = new Map();
    const MAX_TRACKED_CLIENTS = 10_000;
    const undeclaredReservation = Math.max(1, Math.min(UNDECLARED_OPENING_RESERVATION_BYTES, budgetBytes));
    const rejectBusy = (req, res) => {
        if (res.headersSent || res.writableEnded) {
            req.destroy();
            return;
        }
        res.status(503).set('Retry-After', retryAfter).set('Connection', 'close').json({
            statusCode: 503,
            message: 'Too much request body data in flight; retry later',
            error: 'Service Unavailable',
        });
    };
    const rejectCompressed = (req, res) => {
        if (res.headersSent || res.writableEnded) {
            req.destroy();
            return;
        }
        res.status(415).set('Connection', 'close').json({
            statusCode: 415,
            message: 'Compressed request bodies are not supported',
            error: 'Unsupported Media Type',
        });
    };
    const rejectTooLarge = (req, res) => {
        if (res.headersSent || res.writableEnded) {
            req.destroy();
            return;
        }
        res.status(413).set('Connection', 'close').json({
            statusCode: 413,
            message: 'Request body exceeds what this server can accept',
            error: 'Payload Too Large',
        });
    };
    const middleware = (req, res, next) => {
        const declared = parseDeclaredLength(req.headers['content-length']);
        let reserved = declared ?? (req.headers['transfer-encoding'] !== undefined ? undeclaredReservation : 0);
        const bodyIndicated = req.headers['transfer-encoding'] !== undefined || !Number.isNaN(Number(req.headers['content-length']));
        const encoding = (req.headers['content-encoding'] ?? '').trim().toLowerCase();
        if (bodyIndicated && encoding !== '' && encoding !== 'identity') {
            rejectCompressed(req, res);
            return;
        }
        if (reserved === 0) {
            next();
            return;
        }
        const clientIp = (0, ip_1.resolveClientIp)(req, trustedProxies);
        const keyId = classify?.(req, clientIp);
        const anonymous = classify !== undefined && keyId === undefined;
        const clientKey = keyId !== undefined ? `key:${keyId}` : (0, ip_1.limiterKeyForIp)(clientIp);
        const shareCap = anonymous ? anonClientCap : perClientCap;
        const ceiling = anonymous ? bodyLimitBytes : Infinity;
        const clientBusy = clientInFlight.get(clientKey) ?? 0;
        const mapAtCapacity = keyId === undefined && clientInFlight.size >= MAX_TRACKED_CLIENTS && !clientInFlight.has(clientKey);
        const charge = Math.min(reserved, ceiling);
        if (declared !== undefined && (declared > budgetBytes || charge > shareCap || (anonymous && charge > anonPool))) {
            rejectTooLarge(req, res);
            return;
        }
        if (inFlightBytes + reserved > budgetBytes ||
            clientBusy + charge > shareCap ||
            (anonymous && anonInFlight + charge > anonPool) ||
            mapAtCapacity) {
            rejectBusy(req, res);
            return;
        }
        reserved = charge;
        inFlightBytes += reserved;
        if (anonymous)
            anonInFlight += reserved;
        clientInFlight.set(clientKey, clientBusy + reserved);
        let released = false;
        let stallTimer;
        const disarmStallReaper = () => {
            if (stallTimer === undefined)
                return;
            clearInterval(stallTimer);
            stallTimer = undefined;
        };
        const release = () => {
            if (released)
                return;
            released = true;
            disarmStallReaper();
            inFlightBytes -= reserved;
            if (anonymous)
                anonInFlight -= reserved;
            const busy = (clientInFlight.get(clientKey) ?? reserved) - reserved;
            if (busy > 0)
                clientInFlight.set(clientKey, busy);
            else
                clientInFlight.delete(clientKey);
        };
        res.on('finish', release);
        res.on('close', release);
        res.on('error', release);
        req.on('close', release);
        req.on('error', release);
        const socket = req.socket;
        const startBytes = socket.bytesRead;
        let lastBytes = startBytes;
        const admittedAt = Date.now();
        let lastProgress = admittedAt;
        const reconcile = (complete) => {
            if (released || declared !== undefined)
                return;
            const actual = Math.min(Math.max(undeclaredReservation, socket.bytesRead - startBytes), ceiling);
            const delta = actual - reserved;
            if (delta === 0)
                return;
            inFlightBytes += delta;
            if (anonymous)
                anonInFlight += delta;
            reserved = actual;
            const busy = (clientInFlight.get(clientKey) ?? 0) + delta;
            clientInFlight.set(clientKey, busy);
            const overTier = anonymous && anonInFlight > anonPool;
            if (!complete && delta > 0 && (busy > shareCap || inFlightBytes > budgetBytes || overTier)) {
                release();
                req.destroy();
            }
        };
        const settle = () => {
            reconcile(true);
            disarmStallReaper();
        };
        stallTimer = setInterval(() => {
            if (req.complete) {
                settle();
                return;
            }
            reconcile(false);
            if (released)
                return;
            const readNow = socket.bytesRead;
            if (requestTimeoutMs > 0) {
                const target = declared ?? reserved;
                const paced = (target * (Date.now() - admittedAt - STALL_TIMEOUT_MS)) / requestTimeoutMs;
                if (readNow - startBytes < Math.min(target, paced)) {
                    release();
                    req.destroy();
                    return;
                }
            }
            if (readNow !== lastBytes) {
                lastBytes = readNow;
                lastProgress = Date.now();
                if (declared !== undefined && readNow - startBytes >= declared)
                    disarmStallReaper();
                return;
            }
            if (Date.now() - lastProgress >= STALL_TIMEOUT_MS) {
                release();
                req.destroy();
            }
        }, STALL_POLL_MS);
        stallTimer.unref();
        req.on('end', settle);
        next();
    };
    return {
        middleware,
        currentBytes: () => inFlightBytes,
        clientBytes: req => clientInFlight.get((0, ip_1.limiterKeyForIp)((0, ip_1.resolveClientIp)(req, trustedProxies))) ?? 0,
        anonymousBytes: () => anonInFlight,
    };
}
function parseDeclaredLength(raw) {
    if (raw === undefined)
        return undefined;
    const n = Number(raw.trim());
    return Number.isSafeInteger(n) && n >= 0 ? n : undefined;
}
//# sourceMappingURL=inflight-body-budget.js.map