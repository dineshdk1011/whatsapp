"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTTP_REQUEST_METRICS_CLAIMED = void 0;
exports.claimHttpRequestMetrics = claimHttpRequestMetrics;
exports.requestMetricsBoundaryMiddleware = requestMetricsBoundaryMiddleware;
const request_metrics_1 = require("../metrics/request-metrics");
const SKIPPED_PREFIXES = ['/api/health', '/api/metrics'];
exports.HTTP_REQUEST_METRICS_CLAIMED = Symbol('openwa.httpRequestMetricsClaimed');
function claimHttpRequestMetrics(req) {
    req[exports.HTTP_REQUEST_METRICS_CLAIMED] = true;
}
function requestMetricsBoundaryMiddleware(req, res, next) {
    const start = process.hrtime.bigint();
    const record = () => {
        const request = req;
        if (request[exports.HTTP_REQUEST_METRICS_CLAIMED])
            return;
        request[exports.HTTP_REQUEST_METRICS_CLAIMED] = true;
        const routePath = req.route?.path;
        const route = typeof routePath === 'string' ? routePath : '(unmatched)';
        if (SKIPPED_PREFIXES.some(prefix => route.startsWith(prefix)))
            return;
        const seconds = Number(process.hrtime.bigint() - start) / 1e9;
        (0, request_metrics_1.recordHttpRequest)((req.method ?? 'UNKNOWN').toUpperCase(), route, res.statusCode ?? 200, seconds);
    };
    res.on('finish', record);
    res.on('close', record);
    next();
}
//# sourceMappingURL=request-metrics.middleware.js.map