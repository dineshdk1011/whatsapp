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
exports.BaileysVersionResolver = exports.VERSION_RESOLVER_TIMEOUT_MS = exports.DEFAULT_FALLBACK_WA_VERSION = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
exports.DEFAULT_FALLBACK_WA_VERSION = [2, 3000, 1045340097];
exports.VERSION_RESOLVER_TIMEOUT_MS = 5000;
class BaileysVersionResolver {
    options;
    cacheFilePath;
    timeoutMs;
    constructor(options) {
        this.options = options;
        this.cacheFilePath = path.join(this.options.authDir, 'last_known_wa_version.json');
        this.timeoutMs = options.timeoutMs ?? exports.VERSION_RESOLVER_TIMEOUT_MS;
    }
    async resolve(b, resolveOptions = {}) {
        const envVersion = this.resolveFromEnv();
        if (envVersion) {
            return envVersion;
        }
        const waWebVersion = await this.resolveFromWaWeb(b, resolveOptions);
        if (waWebVersion) {
            return waWebVersion;
        }
        if (resolveOptions.signal?.aborted) {
            return exports.DEFAULT_FALLBACK_WA_VERSION;
        }
        const baileysVersion = await this.resolveFromBaileys(b, resolveOptions);
        if (baileysVersion) {
            return baileysVersion;
        }
        if (resolveOptions.signal?.aborted) {
            return exports.DEFAULT_FALLBACK_WA_VERSION;
        }
        const cachedVersion = this.resolveFromDiskCache();
        if (cachedVersion) {
            return cachedVersion;
        }
        this.options.logger.warn(`All remote version endpoints and disk cache unavailable; using fallback WhatsApp Web version: ${exports.DEFAULT_FALLBACK_WA_VERSION.join('.')}`, { sessionId: this.options.sessionId });
        return exports.DEFAULT_FALLBACK_WA_VERSION;
    }
    resolveFromEnv() {
        const raw = process.env.BAILEYS_WA_VERSION?.trim();
        if (!raw) {
            return null;
        }
        const match = raw.match(/^(\d+)[.,](\d+)[.,](\d+)$/);
        if (match) {
            const major = parseInt(match[1], 10);
            const minor = parseInt(match[2], 10);
            const patch = parseInt(match[3], 10);
            if (major === 2 && minor >= 2000 && patch >= 0) {
                const version = [major, minor, patch];
                this.options.logger.log(`Using BAILEYS_WA_VERSION override: ${version.join('.')}`, {
                    sessionId: this.options.sessionId,
                });
                return version;
            }
        }
        this.options.logger.warn(`Invalid BAILEYS_WA_VERSION "${raw}", expected format "2.3000.xxxxxxxxx" (e.g. "2.3000.1045340097")`, { sessionId: this.options.sessionId });
        return null;
    }
    async resolveFromWaWeb(b, resolveOptions) {
        if (typeof b.fetchLatestWaWebVersion !== 'function') {
            return null;
        }
        try {
            const fetchOptions = {
                ...(resolveOptions.dispatcher ? { dispatcher: resolveOptions.dispatcher } : {}),
                signal: AbortSignal.any([
                    AbortSignal.timeout(this.timeoutMs),
                    ...(resolveOptions.signal ? [resolveOptions.signal] : []),
                ]),
            };
            const result = await b.fetchLatestWaWebVersion(fetchOptions);
            if (result?.isLatest === true && this.isValidVersion(result?.version)) {
                const version = result.version;
                this.saveCachedVersion(version);
                return version;
            }
            if (resolveOptions.signal?.aborted) {
                return null;
            }
            this.options.logger.warn(`fetchLatestWaWebVersion returned isLatest=false (${JSON.stringify(result?.version)}); advancing to next tier`, { sessionId: this.options.sessionId });
        }
        catch (err) {
            if (resolveOptions.signal?.aborted) {
                return null;
            }
            this.options.logger.warn(`fetchLatestWaWebVersion failed: ${err instanceof Error ? err.message : String(err)}`, {
                sessionId: this.options.sessionId,
            });
        }
        return null;
    }
    async resolveFromBaileys(b, resolveOptions) {
        if (typeof b.fetchLatestBaileysVersion !== 'function') {
            return null;
        }
        try {
            let timeoutId;
            const timeoutPromise = new Promise((_, reject) => {
                timeoutId = setTimeout(() => reject(new Error('fetchLatestBaileysVersion timeout')), this.timeoutMs);
                timeoutId.unref?.();
            });
            const fetchOptions = (resolveOptions.dispatcher
                ? { dispatcher: resolveOptions.dispatcher }
                : undefined);
            const fetchPromise = b.fetchLatestBaileysVersion(fetchOptions);
            fetchPromise.catch(() => undefined);
            const result = await Promise.race([fetchPromise, timeoutPromise]).finally(() => {
                if (timeoutId)
                    clearTimeout(timeoutId);
            });
            if (result?.isLatest === true && this.isValidVersion(result?.version)) {
                const version = result.version;
                this.saveCachedVersion(version);
                return version;
            }
            if (resolveOptions.signal?.aborted) {
                return null;
            }
            this.options.logger.warn(`fetchLatestBaileysVersion returned isLatest=false (${JSON.stringify(result?.version)}); advancing to next tier`, { sessionId: this.options.sessionId });
        }
        catch (err) {
            if (resolveOptions.signal?.aborted) {
                return null;
            }
            this.options.logger.warn(`fetchLatestBaileysVersion failed: ${err instanceof Error ? err.message : String(err)}`, { sessionId: this.options.sessionId });
        }
        return null;
    }
    resolveFromDiskCache() {
        try {
            if (!fs.existsSync(this.cacheFilePath)) {
                return null;
            }
            const content = fs.readFileSync(this.cacheFilePath, 'utf8');
            const parsed = JSON.parse(content);
            if (this.isValidVersion(parsed)) {
                this.options.logger.warn(`Using cached WhatsApp Web version from disk: ${parsed.join('.')}`, {
                    sessionId: this.options.sessionId,
                });
                return parsed;
            }
        }
        catch {
        }
        return null;
    }
    saveCachedVersion(version) {
        try {
            const dir = path.dirname(this.cacheFilePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(this.cacheFilePath, JSON.stringify(version), 'utf8');
        }
        catch {
        }
    }
    isValidVersion(v) {
        return (Array.isArray(v) &&
            v.length === 3 &&
            v.every((n) => typeof n === 'number' && Number.isInteger(n) && n >= 0));
    }
}
exports.BaileysVersionResolver = BaileysVersionResolver;
//# sourceMappingURL=baileys-version-resolver.js.map