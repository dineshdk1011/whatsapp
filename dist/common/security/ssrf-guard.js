"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSRF_BLOCKED_CLIENT_MESSAGE = exports.SsrfBlockedError = void 0;
exports.redactSsrfError = redactSsrfError;
exports.isSsrfProtectionEnabled = isSsrfProtectionEnabled;
exports.warnUnusableAllowedHosts = warnUnusableAllowedHosts;
exports.isBlockedAddress = isBlockedAddress;
exports.assertNoRedirect = assertNoRedirect;
exports.resolveSafeFetchTarget = resolveSafeFetchTarget;
exports.assertSafeFetchUrl = assertSafeFetchUrl;
exports.pinnedLookup = pinnedLookup;
exports.withSafeFetch = withSafeFetch;
const net_1 = require("net");
const promises_1 = require("dns/promises");
const undici_1 = require("undici");
const proxy_dispatcher_1 = require("./proxy-dispatcher");
const logger_service_1 = require("../services/logger.service");
const logger = (0, logger_service_1.createLogger)('SsrfGuard');
class SsrfBlockedError extends Error {
    constructor(message) {
        super(message);
        this.name = 'SsrfBlockedError';
    }
}
exports.SsrfBlockedError = SsrfBlockedError;
exports.SSRF_BLOCKED_CLIENT_MESSAGE = 'Destination address is not allowed';
function redactSsrfError(error, logger, site) {
    if (error instanceof SsrfBlockedError) {
        logger?.warn(`SSRF guard blocked ${site ?? 'an outbound fetch'}: ${error.message}`);
        return exports.SSRF_BLOCKED_CLIENT_MESSAGE;
    }
    return (error instanceof Error ? error.message : String(error)).replace(/\b(ECONNREFUSED|ENOTFOUND|ETIMEDOUT|EHOSTUNREACH|ECONNRESET|EAI_AGAIN)\s+[\w.-]+(?::\d+)?(?=\s|$)/g, '$1 [redacted]');
}
function isSsrfProtectionEnabled() {
    return process.env.WEBHOOK_SSRF_PROTECT !== 'false';
}
function getAllowedHosts() {
    const entries = allowedHostEntries();
    warnUnusableAllowedHosts(entries);
    return new Set(entries.filter(Boolean));
}
function allowedHostEntries() {
    return ((process.env.SSRF_ALLOWED_HOSTS ?? '')
        .split(',')
        .map(h => h
        .trim()
        .replace(/^\[|\]$/g, '')
        .toLowerCase()));
}
function parsedHostname(entry) {
    try {
        return new URL(`http://${entry.includes(':') ? `[${entry}]` : entry}/`).hostname.replace(/^\[|\]$/g, '');
    }
    catch {
        return null;
    }
}
function unusableAllowedHostReason(entry) {
    if (entry.includes('@') || entry.includes('://'))
        return 'a scheme or credentials';
    if (entry.includes('*'))
        return 'a wildcard';
    if (/[/?#]/.test(entry))
        return 'a path';
    if (/^[^:]+:\d*$/.test(entry))
        return 'a port';
    const parsed = parsedHostname(entry);
    if (parsed === null)
        return 'a value the URL parser rejects';
    return parsed === entry ? undefined : 'a spelling the URL parser rewrites';
}
let warnedUnusableHosts = '';
const MAX_LISTED_UNUSABLE_HOSTS = 20;
function warnUnusableAllowedHosts(entries = allowedHostEntries()) {
    const listed = [];
    let unusable = 0;
    entries.forEach((entry, index) => {
        const reason = entry ? unusableAllowedHostReason(entry) : undefined;
        if (!reason)
            return;
        unusable++;
        if (listed.length < MAX_LISTED_UNUSABLE_HOSTS)
            listed.push(`entry ${index + 1} (${reason})`);
    });
    const more = unusable - listed.length;
    const key = more > 0 ? `${listed.join(', ')}; ${more} more are not listed` : listed.join(', ');
    if (key === warnedUnusableHosts)
        return;
    warnedUnusableHosts = key;
    if (unusable > 0) {
        logger.warn('SSRF_ALLOWED_HOSTS entries must be a bare host name or an IP address written as the URL parser prints it ' +
            `(127.0.0.1, ::1); these never match and are ignored: ${key}` +
            (more > 0 ? ` (the list shows at most ${MAX_LISTED_UNUSABLE_HOSTS})` : ''));
    }
}
const BLOCKED_V4_RANGES = [
    ['0.0.0.0', 8],
    ['10.0.0.0', 8],
    ['100.64.0.0', 10],
    ['127.0.0.0', 8],
    ['169.254.0.0', 16],
    ['172.16.0.0', 12],
    ['192.0.0.0', 24],
    ['192.168.0.0', 16],
    ['198.18.0.0', 15],
    ['224.0.0.0', 4],
    ['240.0.0.0', 4],
];
const BLOCKED_V6_RANGES = [
    ['::', 128],
    ['::1', 128],
    ['0000::', 3],
    ['fc00::', 7],
    ['fe80::', 10],
    ['fec0::', 10],
];
const BLOCKED_V4 = new net_1.BlockList();
for (const [subnet, prefix] of BLOCKED_V4_RANGES)
    BLOCKED_V4.addSubnet(subnet, prefix, 'ipv4');
const BLOCKED_V6 = new net_1.BlockList();
for (const [subnet, prefix] of BLOCKED_V6_RANGES)
    BLOCKED_V6.addSubnet(subnet, prefix, 'ipv6');
const GLOBAL_UNICAST_V6 = new net_1.BlockList();
GLOBAL_UNICAST_V6.addSubnet('2000::', 3, 'ipv6');
function hextetsToV4(hi, lo) {
    return `${(hi >> 8) & 0xff}.${hi & 0xff}.${(lo >> 8) & 0xff}.${lo & 0xff}`;
}
function expandIPv6(lower) {
    let s = lower;
    const dotted = s.match(/(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (dotted) {
        const octets = dotted.slice(1, 5).map(Number);
        if (octets.some(o => o > 255))
            return null;
        const [a, b, c, d] = octets;
        s = s.slice(0, dotted.index) + `${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}`;
    }
    const halves = s.split('::');
    if (halves.length > 2)
        return null;
    const head = halves[0] ? halves[0].split(':') : [];
    const tail = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
    const gap = 8 - head.length - tail.length;
    if (halves.length === 1 ? head.length !== 8 : gap < 1)
        return null;
    const parts = [...head, ...Array(Math.max(gap, 0)).fill('0'), ...tail];
    if (parts.length !== 8)
        return null;
    const nums = parts.map(h => (/^[0-9a-f]{1,4}$/.test(h) ? parseInt(h, 16) : NaN));
    return nums.some(n => Number.isNaN(n)) ? null : nums;
}
function isBlockedAddress(ip) {
    if ((0, net_1.isIPv4)(ip)) {
        return BLOCKED_V4.check(ip, 'ipv4');
    }
    if ((0, net_1.isIPv6)(ip)) {
        const lower = ip.toLowerCase();
        if (lower.startsWith('::ffff:')) {
            const tail = lower.slice('::ffff:'.length);
            if (/^\d{1,3}(\.\d{1,3}){3}$/.test(tail)) {
                return isBlockedAddress(tail);
            }
            const hextets = tail.split(':');
            if (hextets.length === 2 && hextets.every(h => /^[0-9a-f]{1,4}$/.test(h))) {
                const hi = parseInt(hextets[0], 16);
                const lo = parseInt(hextets[1], 16);
                return isBlockedAddress(hextetsToV4(hi, lo));
            }
        }
        const hextets = expandIPv6(lower);
        if (hextets) {
            if (hextets[0] === 0x2002) {
                return isBlockedAddress(hextetsToV4(hextets[1], hextets[2]));
            }
            if (hextets[0] === 0x64 &&
                hextets[1] === 0xff9b &&
                hextets[2] <= 1 &&
                hextets[3] === 0 &&
                hextets[4] === 0 &&
                hextets[5] === 0) {
                return isBlockedAddress(hextetsToV4(hextets[6], hextets[7]));
            }
            if (hextets.slice(0, 6).every(h => h === 0) && (hextets[6] | hextets[7]) !== 0) {
                return isBlockedAddress(hextetsToV4(hextets[6], hextets[7]));
            }
            if (hextets[0] === 0 &&
                hextets[1] === 0 &&
                hextets[2] === 0 &&
                hextets[3] === 0 &&
                hextets[4] === 0xffff &&
                hextets[5] === 0) {
                return isBlockedAddress(hextetsToV4(hextets[6], hextets[7]));
            }
            if (hextets[0] === 0 &&
                hextets[1] === 0 &&
                hextets[2] === 0 &&
                hextets[3] === 0 &&
                hextets[4] === 0 &&
                hextets[5] === 0xffff) {
                return isBlockedAddress(hextetsToV4(hextets[6], hextets[7]));
            }
        }
        return BLOCKED_V6.check(lower, 'ipv6') || !GLOBAL_UNICAST_V6.check(lower, 'ipv6');
    }
    return true;
}
function assertNoRedirect(response, url) {
    if (response.type === 'opaqueredirect' || (response.status >= 300 && response.status < 400)) {
        throw new SsrfBlockedError(`Refusing to follow redirect from ${url}`);
    }
}
const DEFAULT_DNS_TIMEOUT_MS = 10000;
const MAX_TIMER_MS = 2147483647;
function resolveDnsTimeoutMs() {
    const raw = process.env.SSRF_DNS_TIMEOUT_MS;
    const n = raw !== undefined ? Number(raw) : NaN;
    return Number.isInteger(n) && n > 0 && n <= MAX_TIMER_MS ? n : DEFAULT_DNS_TIMEOUT_MS;
}
const MAX_REDIRECT_HOPS = 5;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
async function lookupWithDeadline(host, signal) {
    if (signal?.aborted)
        throw signal.reason;
    const lookupPromise = (0, promises_1.lookup)(host, { all: true });
    lookupPromise.catch(() => undefined);
    let timer;
    let onAbort;
    const deadline = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new SsrfBlockedError(`Timed out resolving host: ${host}`)), resolveDnsTimeoutMs());
        if (signal) {
            onAbort = () => reject(signal.reason);
            signal.addEventListener('abort', onAbort, { once: true });
        }
    });
    try {
        return await Promise.race([lookupPromise, deadline]);
    }
    catch (err) {
        if (signal?.aborted)
            throw signal.reason;
        if (err instanceof SsrfBlockedError)
            throw err;
        const code = err?.code;
        throw new SsrfBlockedError(`Could not resolve host: ${host}${code ? ` (${code})` : ''}`);
    }
    finally {
        if (timer)
            clearTimeout(timer);
        if (signal && onAbort)
            signal.removeEventListener('abort', onAbort);
    }
}
async function resolveSafeFetchTarget(rawUrl, signal) {
    let url;
    try {
        url = new URL(rawUrl);
    }
    catch {
        throw new SsrfBlockedError(`Invalid URL: ${rawUrl}`);
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new SsrfBlockedError(`Blocked URL scheme: ${url.protocol}`);
    }
    const host = url.hostname.replace(/^\[|\]$/g, '');
    if (getAllowedHosts().has(host.toLowerCase())) {
        return lookupWithDeadline(host, signal);
    }
    if ((0, net_1.isIPv4)(host) || (0, net_1.isIPv6)(host)) {
        if (isBlockedAddress(host)) {
            throw new SsrfBlockedError(`Blocked internal address: ${host}`);
        }
        return null;
    }
    const resolved = await lookupWithDeadline(host, signal);
    if (resolved.length === 0) {
        throw new SsrfBlockedError(`Could not resolve host: ${host}`);
    }
    for (const { address } of resolved) {
        if (isBlockedAddress(address)) {
            throw new SsrfBlockedError(`Host ${host} resolves to a blocked internal address: ${address}`);
        }
    }
    return resolved;
}
async function assertSafeFetchUrl(rawUrl, signal) {
    await resolveSafeFetchTarget(rawUrl, signal);
}
function pinnedLookup(addresses) {
    const fn = (_hostname, options, callback) => {
        if (options.all) {
            callback(null, addresses);
        }
        else {
            callback(null, addresses[0].address, addresses[0].family);
        }
    };
    return fn;
}
async function settleUnreadResponseBody(response) {
    if (response.bodyUsed || !response.body || response.body.locked)
        return;
    if (typeof response.body.cancel !== 'function')
        return;
    await response.body.cancel().catch(() => undefined);
}
async function useAndSettleBody(response, use) {
    try {
        return await use(response);
    }
    finally {
        await settleUnreadResponseBody(response);
    }
}
function isInsecureRedirectHopAllowed() {
    return process.env.PLUGIN_DOWNLOAD_ALLOW_INSECURE_REDIRECTS === 'true';
}
function nextRedirectHopInit(init, status, nextUrl, initialOrigin) {
    let next = init;
    if (status !== 307 &&
        status !== 308 &&
        next.method !== undefined &&
        next.method !== 'GET' &&
        next.method !== 'HEAD') {
        next = { ...next, method: 'GET' };
        delete next.body;
    }
    if (new URL(nextUrl).origin !== initialOrigin && next.headers !== undefined) {
        const headers = new undici_1.Headers(next.headers);
        headers.delete('authorization');
        headers.delete('cookie');
        next = { ...next, headers };
    }
    return next;
}
function requestDispatcher(proxyUrl, target) {
    if (proxyUrl) {
        return (0, proxy_dispatcher_1.createProxyDispatcher)(proxyUrl, { pinnedAddresses: target?.map(({ address }) => address) });
    }
    return target ? new undici_1.Agent({ connect: { lookup: pinnedLookup(target) } }) : undefined;
}
async function withSafeFetch(rawUrl, init, use, opts = {}) {
    const guard = opts.guard ?? true;
    if (!guard) {
        const follow = process.env.WEBHOOK_SSRF_REDIRECTS === 'true';
        const dispatcher = requestDispatcher(opts.proxyUrl, null);
        try {
            return await useAndSettleBody(await (0, undici_1.fetch)(rawUrl, { ...init, redirect: follow ? 'follow' : 'error', dispatcher }), use);
        }
        finally {
            if (dispatcher)
                await dispatcher.destroy().catch(() => undefined);
        }
    }
    if (opts.followRedirects) {
        let currentUrl = rawUrl;
        let initialOrigin;
        let hopInit = init;
        let sawSecureHop = false;
        for (let hop = 0;; hop++) {
            const target = await resolveSafeFetchTarget(currentUrl, init.signal);
            const current = new URL(currentUrl);
            initialOrigin ??= current.origin;
            if (current.protocol === 'http:' && sawSecureHop && !isInsecureRedirectHopAllowed()) {
                throw new Error(`Refusing redirect that downgrades from https to http: ${currentUrl}`);
            }
            if (current.protocol === 'https:')
                sawSecureHop = true;
            const dispatcher = requestDispatcher(opts.proxyUrl, target);
            try {
                const response = await (0, undici_1.fetch)(currentUrl, { ...hopInit, redirect: 'manual', dispatcher });
                if (!REDIRECT_STATUSES.has(response.status)) {
                    return await useAndSettleBody(response, use);
                }
                const location = response.headers.get('location');
                await settleUnreadResponseBody(response);
                if (!location) {
                    throw new SsrfBlockedError(`Redirect from ${currentUrl} carried no Location header`);
                }
                if (hop >= MAX_REDIRECT_HOPS) {
                    throw new Error(`Too many redirects while fetching ${rawUrl}`);
                }
                const nextUrl = new URL(location, currentUrl).toString();
                hopInit = nextRedirectHopInit(hopInit, response.status, nextUrl, initialOrigin);
                currentUrl = nextUrl;
            }
            finally {
                if (dispatcher)
                    await dispatcher.destroy().catch(() => undefined);
            }
        }
    }
    const target = await resolveSafeFetchTarget(rawUrl, init.signal);
    const dispatcher = requestDispatcher(opts.proxyUrl, target);
    try {
        const response = await (0, undici_1.fetch)(rawUrl, { ...init, redirect: 'manual', dispatcher });
        try {
            assertNoRedirect(response, rawUrl);
            return await use(response);
        }
        finally {
            await settleUnreadResponseBody(response);
        }
    }
    finally {
        if (dispatcher)
            await dispatcher.destroy().catch(() => undefined);
    }
}
//# sourceMappingURL=ssrf-guard.js.map