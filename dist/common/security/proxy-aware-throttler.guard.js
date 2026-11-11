"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProxyAwareThrottlerGuard = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const ip_1 = require("../utils/ip");
const logger_service_1 = require("../services/logger.service");
const logger = (0, logger_service_1.createLogger)('ProxyAwareThrottlerGuard');
const LIBRARY_DEFAULT_SKIP_KEY = 'THROTTLER:SKIPdefault';
let ProxyAwareThrottlerGuard = class ProxyAwareThrottlerGuard extends throttler_1.ThrottlerGuard {
    warnedSharedProxyBucket = false;
    getTracker(req) {
        const trustedProxies = (0, ip_1.parseTrustedProxies)(process.env.TRUSTED_PROXIES);
        if (trustedProxies.length === 0 && !this.warnedSharedProxyBucket) {
            const headers = (req.headers ?? {});
            if (headers['x-forwarded-for'] !== undefined) {
                this.warnedSharedProxyBucket = true;
                logger.warn('X-Forwarded-For is present but TRUSTED_PROXIES is empty: every client shares one ' +
                    'rate-limit bucket keyed on the proxy address (and per-key IP allowlists see the proxy ' +
                    'too). Set TRUSTED_PROXIES to the proxy address/subnet to key limits per client.');
            }
        }
        const clientIp = (0, ip_1.resolveClientIp)(req, trustedProxies);
        return Promise.resolve((0, throttler_1.normalizeIp)(clientIp, this.ipv6SubnetPrefix));
    }
    shouldSkip(context) {
        const skip = this.reflector.getAllAndOverride(LIBRARY_DEFAULT_SKIP_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        return Promise.resolve(skip === true);
    }
    async throwThrottlingException(context, throttlerLimitDetail) {
        if (this.commonOptions.setHeaders ?? true) {
            const { res } = this.getRequestResponse(context);
            res.header('Retry-After', String(throttlerLimitDetail.timeToBlockExpire));
        }
        await super.throwThrottlingException(context, throttlerLimitDetail);
    }
};
exports.ProxyAwareThrottlerGuard = ProxyAwareThrottlerGuard;
exports.ProxyAwareThrottlerGuard = ProxyAwareThrottlerGuard = __decorate([
    (0, common_1.Injectable)()
], ProxyAwareThrottlerGuard);
//# sourceMappingURL=proxy-aware-throttler.guard.js.map