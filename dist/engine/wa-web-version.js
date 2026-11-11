"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PINNED_HTML_TIMEOUT_MS = exports.WEB_VERSION_SETTLE_MS = exports.WA_VERSION_REGISTRY_URL = void 0;
exports.__resetWebVersionCache = __resetWebVersionCache;
exports.pickSettledWebVersion = pickSettledWebVersion;
exports.resolveCurrentWebVersion = resolveCurrentWebVersion;
exports.resolveWebVersionPin = resolveWebVersionPin;
exports.getEffectiveWebVersionInfo = getEffectiveWebVersionInfo;
const crypto_1 = require("crypto");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const logger_service_1 = require("../common/services/logger.service");
const logger = (0, logger_service_1.createLogger)('WebVersion');
exports.WA_VERSION_REGISTRY_URL = 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/versions.json';
const DEFAULT_REMOTE_TEMPLATE = 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/{version}.html';
const FAILURE_BACKOFF_MS = 60_000;
exports.WEB_VERSION_SETTLE_MS = 12 * 60 * 60 * 1000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
let cachedCurrentVersion;
let cachedAt = 0;
let inFlight = null;
let lastFailureAt = 0;
let warnedRemoteTrust = false;
exports.PINNED_HTML_TIMEOUT_MS = 10_000;
const PINNED_HTML_MIN_LENGTH = 1024;
const PINNED_HTML_KEEP_MS = 7 * 24 * 60 * 60 * 1000;
const pinnedHtml = new Map();
const pinnedHtmlInFlight = new Map();
function __resetWebVersionCache() {
    cachedCurrentVersion = undefined;
    cachedAt = 0;
    inFlight = null;
    lastFailureAt = 0;
    warnedRemoteTrust = false;
    pinnedHtml.clear();
    pinnedHtmlInFlight.clear();
}
function warnRemoteTrustOnce(pin) {
    if (warnedRemoteTrust)
        return;
    warnedRemoteTrust = true;
    logger.warn('WhatsApp Web build pinned to remote HTML served into the web.whatsapp.com origin WITHOUT an integrity check', {
        action: 'web_version_remote_pin',
        webVersion: pin.webVersion,
        remotePath: splitCredentials(pin.webVersionCache.remotePath).href,
        optOut: 'set WWEBJS_WEB_VERSION=off for the first-party build served by WhatsApp, or point WWEBJS_WEB_VERSION_REMOTE_PATH at an operator-controlled copy',
    });
}
function warnResolveFailed(reason, previous) {
    if (previous) {
        logger.warn('Could not refresh the WhatsApp Web build from the wa-version registry; keeping the previous pin', {
            action: 'web_version_refresh_failed',
            reason,
            webVersion: previous,
            registry: exports.WA_VERSION_REGISTRY_URL,
        });
        return;
    }
    logger.warn('Could not resolve a WhatsApp Web build from the wa-version registry — continuing WITHOUT a pin', {
        action: 'web_version_resolve_failed',
        reason,
        registry: exports.WA_VERSION_REGISTRY_URL,
        consequence: "whatsapp-web.js selects the build itself, which on some setups authenticates then never reaches 'ready'",
        remedy: 'confirm the host can reach the registry URL, or set WWEBJS_WEB_VERSION to an exact build (or "off" to accept the first-party build)',
    });
}
function buildRemotePin(version) {
    const template = process.env.WWEBJS_WEB_VERSION_REMOTE_PATH?.trim() || DEFAULT_REMOTE_TEMPLATE;
    return {
        webVersion: version,
        webVersionCache: { type: 'remote', remotePath: template.replace('{version}', version) },
    };
}
function pickSettledWebVersion(versions, now, currentVersion) {
    if (!Array.isArray(versions))
        return currentVersion;
    const settledCutoff = now - exports.WEB_VERSION_SETTLE_MS;
    let best = null;
    for (const raw of versions) {
        if (!raw || typeof raw !== 'object')
            continue;
        const e = raw;
        if (typeof e.version !== 'string' || !/^\d/.test(e.version))
            continue;
        if (e.beta === true)
            continue;
        const released = typeof e.released === 'string' ? Date.parse(e.released) : NaN;
        if (!Number.isFinite(released) || released > settledCutoff)
            continue;
        const expire = typeof e.expire === 'string' ? Date.parse(e.expire) : NaN;
        if (Number.isFinite(expire) && expire <= now)
            continue;
        if (!best || best.released < released)
            best = { version: e.version, released };
    }
    return best?.version ?? currentVersion;
}
async function resolveCurrentWebVersion(fetcher = fetch) {
    const previous = cachedCurrentVersion ?? null;
    if (previous && Date.now() - cachedAt < CACHE_TTL_MS)
        return previous;
    if (inFlight)
        return inFlight;
    if (lastFailureAt && Date.now() - lastFailureAt < FAILURE_BACKOFF_MS)
        return previous;
    inFlight = (async () => {
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 5000);
            try {
                const res = await fetcher(exports.WA_VERSION_REGISTRY_URL, { signal: controller.signal });
                if (!res.ok)
                    throw new Error(`HTTP ${res.status}`);
                const json = (await res.json());
                const rawCurrent = typeof json.currentVersion === 'string' && /^\d/.test(json.currentVersion) ? json.currentVersion : null;
                const picked = pickSettledWebVersion(json.versions, Date.now(), rawCurrent);
                if (picked) {
                    cachedCurrentVersion = picked;
                    cachedAt = Date.now();
                    return picked;
                }
                lastFailureAt = Date.now();
                warnResolveFailed('the registry carried no usable build', previous);
                return previous;
            }
            finally {
                clearTimeout(timer);
            }
        }
        catch (error) {
            lastFailureAt = Date.now();
            warnResolveFailed(error instanceof Error ? error.message : String(error), previous);
            return previous;
        }
        finally {
            inFlight = null;
        }
    })();
    return inFlight;
}
async function resolveWebVersionPin(fetcher = fetch, cacheDir) {
    const raw = process.env.WWEBJS_WEB_VERSION?.trim();
    const lc = raw?.toLowerCase();
    let pin;
    if (raw && lc !== 'off' && lc !== 'latest' && lc !== 'auto') {
        pin = buildRemotePin(raw);
    }
    else {
        if (lc === 'off')
            return undefined;
        const current = await resolveCurrentWebVersion(fetcher);
        if (!current)
            return undefined;
        pin = buildRemotePin(current);
    }
    warnRemoteTrustOnce(pin);
    return cacheDir ? localisePin(pin, cacheDir, fetcher) : pin;
}
async function localisePin(pin, cacheDir, fetcher) {
    const { webVersion } = pin;
    const { remotePath } = pin.webVersionCache;
    try {
        if (!/^\d[\w.-]*$/.test(webVersion))
            throw new Error('the version is not a WhatsApp Web build number');
        const html = await fetchPinnedHtml(remotePath, fetcher);
        writePinnedHtml(cacheDir, webVersion, html);
        return { webVersion, webVersionCache: { type: 'local', path: cacheDir, strict: true } };
    }
    catch (error) {
        logger.warn('Could not load the pinned WhatsApp Web build; continuing WITHOUT a pin', {
            action: 'web_version_html_unavailable',
            reason: error instanceof Error ? error.message : String(error),
            webVersion,
            remotePath: splitCredentials(remotePath).href,
            consequence: "the live WhatsApp Web build loads instead, which on some setups authenticates then never reaches 'ready'",
            remedy: 'confirm the host can reach remotePath, pin a build the registry still serves in WWEBJS_WEB_VERSION, or point WWEBJS_WEB_VERSION_REMOTE_PATH at a reachable copy',
        });
        return undefined;
    }
}
function fetchPinnedHtml(remotePath, fetcher) {
    const cached = pinnedHtml.get(remotePath);
    if (cached)
        return Promise.resolve(cached);
    let pending = pinnedHtmlInFlight.get(remotePath);
    if (!pending) {
        pending = downloadPinnedHtml(remotePath, fetcher).finally(() => pinnedHtmlInFlight.delete(remotePath));
        pinnedHtmlInFlight.set(remotePath, pending);
    }
    return pending;
}
async function downloadPinnedHtml(remotePath, fetcher) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), exports.PINNED_HTML_TIMEOUT_MS);
    try {
        const { href, authorization } = splitCredentials(remotePath);
        const headers = authorization ? { Authorization: authorization } : {};
        const res = await fetcher(href, { signal: controller.signal, headers });
        if (!res.ok)
            throw new Error(`HTTP ${res.status}`);
        const html = await res.text();
        if (html.length < PINNED_HTML_MIN_LENGTH || !/<html/i.test(html)) {
            throw new Error('the response is not a WhatsApp Web page');
        }
        pinnedHtml.clear();
        pinnedHtml.set(remotePath, html);
        return html;
    }
    catch (error) {
        if (controller.signal.aborted)
            throw new Error(`no answer within ${exports.PINNED_HTML_TIMEOUT_MS} ms`, { cause: error });
        throw error;
    }
    finally {
        clearTimeout(timer);
    }
}
function splitCredentials(remotePath) {
    let url;
    try {
        url = new URL(remotePath);
    }
    catch {
        return { href: remotePath };
    }
    if (!url.username && !url.password)
        return { href: remotePath };
    const decode = (part) => {
        try {
            return decodeURIComponent(part);
        }
        catch {
            return part;
        }
    };
    const authorization = `Basic ${Buffer.from(`${decode(url.username)}:${decode(url.password)}`).toString('base64')}`;
    url.username = '';
    url.password = '';
    return { href: url.href, authorization };
}
function writePinnedHtml(cacheDir, version, html) {
    fs.mkdirSync(cacheDir, { recursive: true });
    const file = path.join(cacheDir, `${version}.html`);
    const tmp = `${file}.${(0, crypto_1.randomUUID)()}.tmp`;
    try {
        fs.writeFileSync(tmp, html);
        fs.renameSync(tmp, file);
    }
    catch (error) {
        fs.rmSync(tmp, { force: true });
        throw error;
    }
    for (const name of fs.readdirSync(cacheDir)) {
        const other = path.join(cacheDir, name);
        if (other === file)
            continue;
        try {
            if (Date.now() - fs.statSync(other).mtimeMs > PINNED_HTML_KEEP_MS)
                fs.rmSync(other, { force: true });
        }
        catch {
        }
    }
}
function getEffectiveWebVersionInfo() {
    const raw = process.env.WWEBJS_WEB_VERSION?.trim();
    const lc = raw?.toLowerCase();
    if (raw && lc !== 'off' && lc !== 'latest' && lc !== 'auto')
        return { version: raw, source: 'pinned' };
    if (lc === 'off')
        return { version: null, source: 'native' };
    return { version: cachedCurrentVersion ?? null, source: 'auto' };
}
//# sourceMappingURL=wa-web-version.js.map