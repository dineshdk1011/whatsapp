"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expectedSha256FromUrl = expectedSha256FromUrl;
exports.assertDownloadSha256 = assertDownloadSha256;
exports.assertPluginInstallUrl = assertPluginInstallUrl;
exports.fetchSafeBuffer = fetchSafeBuffer;
const crypto_1 = require("crypto");
const ssrf_guard_1 = require("../../common/security/ssrf-guard");
const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;
const DEFAULT_TIMEOUT_MS = 30_000;
const SHA256_HEX = /^[0-9a-f]{64}$/i;
function expectedSha256FromUrl(url) {
    let parsed;
    try {
        parsed = new URL(url);
    }
    catch {
        return null;
    }
    if (!parsed.hash.startsWith('#sha256='))
        return null;
    const digest = parsed.hash.slice('#sha256='.length).trim().toLowerCase();
    if (!SHA256_HEX.test(digest)) {
        throw new Error('the URL carries a sha256 integrity marker that is not a 64-character hex digest');
    }
    return digest;
}
function assertDownloadSha256(url, body) {
    const expected = expectedSha256FromUrl(url);
    if (expected === null)
        return;
    const actual = (0, crypto_1.createHash)('sha256').update(body).digest('hex');
    if (actual !== expected) {
        throw new Error(`sha256 mismatch for the downloaded package (expected ${expected}, got ${actual})`);
    }
}
function assertPluginInstallUrl(url) {
    let parsed;
    try {
        parsed = new URL(url);
    }
    catch {
        return;
    }
    let pinned = false;
    try {
        pinned = expectedSha256FromUrl(url) !== null;
    }
    catch (error) {
        if (parsed.protocol === 'http:')
            throw error;
    }
    if (parsed.protocol === 'http:' && !pinned) {
        throw new Error('plain http is only accepted with a content pin: append #sha256=<64 hex> to the URL, or use https');
    }
    const requirePin = process.env.PLUGIN_INSTALL_REQUIRE_PIN === 'true' ||
        (process.env.PLUGIN_INSTALL_REQUIRE_PIN !== 'false' && process.env.NODE_ENV === 'production');
    if (requirePin && !pinned) {
        throw new Error('installing from a URL requires an integrity pin in this deployment: append #sha256=<64 hex> to the URL (PLUGIN_INSTALL_REQUIRE_PIN=false disables this)');
    }
}
async function fetchSafeBuffer(url, opts = {}) {
    const maxBytes = Number.isFinite(opts.maxBytes) && opts.maxBytes > 0 ? opts.maxBytes : DEFAULT_MAX_BYTES;
    const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    return (0, ssrf_guard_1.withSafeFetch)(url, { signal: AbortSignal.timeout(timeoutMs) }, async (response) => {
        if (!response.ok) {
            throw new Error(`download failed with status ${response.status}`);
        }
        const declaredLength = Number(response.headers.get('content-length') ?? '');
        if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
            throw new Error(`download exceeds the ${maxBytes}-byte limit`);
        }
        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('download response has no body');
        }
        const chunks = [];
        let total = 0;
        for (;;) {
            const { done, value } = (await reader.read());
            if (done)
                break;
            total += value.byteLength;
            if (total > maxBytes) {
                await reader.cancel();
                throw new Error(`download exceeds the ${maxBytes}-byte limit`);
            }
            chunks.push(Buffer.from(value));
        }
        return Buffer.concat(chunks);
    }, { followRedirects: true });
}
//# sourceMappingURL=plugin-download.js.map