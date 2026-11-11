"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.__resetUpdateCheckCache = __resetUpdateCheckCache;
exports.isNewerRelease = isNewerRelease;
exports.checkForUpdate = checkForUpdate;
const plugin_download_1 = require("../plugins/plugin-download");
const catalog_1 = require("../plugins/catalog");
const ssrf_guard_1 = require("../../common/security/ssrf-guard");
const logger_service_1 = require("../../common/services/logger.service");
const logger = (0, logger_service_1.createLogger)('UpdateCheck');
const { version: APP_VERSION } = require('../../../package.json');
const LATEST_RELEASE_URL = 'https://api.github.com/repos/rmyndharis/OpenWA/releases/latest';
const RELEASE_PAGE_URL = 'https://github.com/rmyndharis/OpenWA/releases/tag/';
const SUCCESS_TTL_MS = 6 * 60 * 60_000;
const FAILURE_BACKOFF_MS = 15 * 60_000;
const MAX_BYTES = 256 * 1024;
const TIMEOUT_MS = 5_000;
const RELEASE_TAG = /^v?(\d+\.\d+\.\d+)$/;
let latest = null;
let nextCheckAt = 0;
let inFlight = null;
function __resetUpdateCheckCache() {
    latest = null;
    nextCheckAt = 0;
    inFlight = null;
}
async function refresh() {
    try {
        const body = JSON.parse((await (0, plugin_download_1.fetchSafeBuffer)(LATEST_RELEASE_URL, { maxBytes: MAX_BYTES, timeoutMs: TIMEOUT_MS })).toString('utf8'));
        const tag = typeof body.tag_name === 'string' ? body.tag_name : '';
        const match = RELEASE_TAG.exec(tag);
        latest = match ? { version: match[1], url: `${RELEASE_PAGE_URL}${tag}` } : null;
        nextCheckAt = Date.now() + SUCCESS_TTL_MS;
    }
    catch (error) {
        logger.debug('Release check failed', { error: (0, ssrf_guard_1.redactSsrfError)(error) });
        nextCheckAt = Date.now() + FAILURE_BACKOFF_MS;
    }
}
function isNewerRelease(latest, current) {
    const cmp = (0, catalog_1.compareSemver)(latest, current);
    return cmp > 0 || (cmp === 0 && current.includes('-'));
}
async function checkForUpdate() {
    if (process.env.UPDATE_CHECK_ENABLED === 'false') {
        return { current: APP_VERSION, latest: null, updateAvailable: false, releaseUrl: null };
    }
    if (Date.now() >= nextCheckAt) {
        inFlight ??= refresh().finally(() => {
            inFlight = null;
        });
        await inFlight;
    }
    return {
        current: APP_VERSION,
        latest: latest?.version ?? null,
        updateAvailable: latest !== null && isNewerRelease(latest.version, APP_VERSION),
        releaseUrl: latest?.url ?? null,
    };
}
//# sourceMappingURL=update-check.js.map