"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LINK_PREVIEW_THUMBNAIL_MAX_BYTES = void 0;
exports.loadRemoteMediaBuffer = loadRemoteMediaBuffer;
const common_1 = require("@nestjs/common");
const engine_not_sent_error_1 = require("../errors/engine-not-sent.error");
const ssrf_guard_1 = require("../security/ssrf-guard");
const proxy_dispatcher_1 = require("../security/proxy-dispatcher");
const logger_service_1 = require("../services/logger.service");
const env_int_1 = require("../utils/env-int");
const logger = (0, logger_service_1.createLogger)('RemoteMedia');
const DEFAULT_MEDIA_MAX_BYTES = 50 * 1024 * 1024;
const DEFAULT_MEDIA_TIMEOUT_MS = 30_000;
exports.LINK_PREVIEW_THUMBNAIL_MAX_BYTES = 5 * 1024 * 1024;
async function loadRemoteMediaBuffer(url, sessionProxyUrl, opts = {}) {
    const maxBytes = Math.min(opts.maxBytes ?? Number.POSITIVE_INFINITY, (0, env_int_1.positiveIntFromEnv)('MEDIA_DOWNLOAD_MAX_BYTES', DEFAULT_MEDIA_MAX_BYTES));
    const timeoutMs = (0, env_int_1.positiveIntFromEnv)('MEDIA_DOWNLOAD_TIMEOUT_MS', DEFAULT_MEDIA_TIMEOUT_MS);
    const proxyUrl = (0, proxy_dispatcher_1.urlFetchProxy)(sessionProxyUrl);
    let responded = false;
    return (0, ssrf_guard_1.withSafeFetch)(url, { signal: AbortSignal.timeout(timeoutMs) }, async (response) => {
        responded = true;
        if (!response.ok) {
            throw new common_1.BadRequestException(`Media fetch failed with status ${response.status}`);
        }
        const declaredLength = Number(response.headers.get('content-length') ?? '');
        if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
            throw new common_1.PayloadTooLargeException(`Media exceeds the ${maxBytes}-byte limit`);
        }
        const reader = response.body?.getReader();
        if (!reader) {
            throw new common_1.BadRequestException('Media response has no body');
        }
        const chunks = [];
        let total = 0;
        for (;;) {
            const { done, value } = (await reader.read());
            if (done) {
                break;
            }
            total += value.byteLength;
            if (total > maxBytes) {
                await reader.cancel();
                throw new common_1.PayloadTooLargeException(`Media exceeds the ${maxBytes}-byte limit`);
            }
            chunks.push(Buffer.from(value));
        }
        const mimetype = (response.headers.get('content-type') ?? '').split(';')[0].trim();
        return { data: Buffer.concat(chunks), mimetype };
    }, { proxyUrl }).catch((error) => {
        if (error instanceof common_1.HttpException || error instanceof ssrf_guard_1.SsrfBlockedError)
            throw (0, engine_not_sent_error_1.markNothingSent)(error);
        const name = error?.name;
        const proxyHop = proxyUrl !== undefined && !responded;
        if (name === 'TimeoutError' || name === 'AbortError') {
            if (proxyHop) {
                throw new engine_not_sent_error_1.EngineNotSentError(`Media fetch through the session proxy timed out after ${timeoutMs} ms`);
            }
            throw (0, engine_not_sent_error_1.markNothingSent)(new common_1.BadRequestException(`Media fetch timed out after ${timeoutMs} ms`));
        }
        if (error instanceof TypeError && (error.message === 'fetch failed' || error.message === 'terminated')) {
            const cause = error.cause;
            logger.warn('Media fetch failed', { cause: cause instanceof Error ? cause.message : error.message });
            if (proxyHop)
                throw new engine_not_sent_error_1.EngineNotSentError('Media fetch through the session proxy failed');
            throw (0, engine_not_sent_error_1.markNothingSent)(new common_1.BadRequestException('Media fetch failed'));
        }
        throw error;
    });
}
//# sourceMappingURL=load-remote-media.js.map