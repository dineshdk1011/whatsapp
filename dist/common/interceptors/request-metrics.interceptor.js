"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestMetricsInterceptor = void 0;
const common_1 = require("@nestjs/common");
const request_metrics_1 = require("../metrics/request-metrics");
const request_metrics_middleware_1 = require("../middleware/request-metrics.middleware");
const SKIPPED_PREFIXES = ['/api/health', '/api/metrics'];
let RequestMetricsInterceptor = class RequestMetricsInterceptor {
    intercept(context, next) {
        const req = context.switchToHttp().getRequest();
        const res = context.switchToHttp().getResponse();
        const route = resolveRoute(context, req);
        if (route === null || SKIPPED_PREFIXES.some(prefix => route.startsWith(prefix))) {
            return next.handle();
        }
        (0, request_metrics_middleware_1.claimHttpRequestMetrics)(req);
        const method = (req.method ?? 'UNKNOWN').toUpperCase();
        const start = process.hrtime.bigint();
        let recorded = false;
        const record = () => {
            if (recorded)
                return;
            recorded = true;
            const seconds = Number(process.hrtime.bigint() - start) / 1e9;
            (0, request_metrics_1.recordHttpRequest)(method, route, res.statusCode ?? 200, seconds);
        };
        res.on('finish', record);
        res.on('close', record);
        return next.handle();
    }
};
exports.RequestMetricsInterceptor = RequestMetricsInterceptor;
exports.RequestMetricsInterceptor = RequestMetricsInterceptor = __decorate([
    (0, common_1.Injectable)()
], RequestMetricsInterceptor);
function resolveRoute(context, req) {
    const expressRoute = req.route?.path;
    if (expressRoute)
        return expressRoute;
    try {
        const className = context.getClass()?.name;
        const handlerName = context.getHandler()?.name;
        if (className && handlerName)
            return `${className}#${handlerName}`;
    }
    catch {
    }
    return null;
}
//# sourceMappingURL=request-metrics.interceptor.js.map