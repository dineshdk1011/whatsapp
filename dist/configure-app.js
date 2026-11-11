"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureApp = configureApp;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const helmet_1 = __importDefault(require("helmet"));
const express_1 = require("express");
const crypto_1 = require("crypto");
const fs_1 = require("fs");
const path_1 = require("path");
const app_module_1 = require("./app.module");
const inflight_body_budget_1 = require("./config/inflight-body-budget");
const active_key_index_1 = require("./modules/auth/active-key-index");
const request_context_middleware_1 = require("./common/middleware/request-context.middleware");
const logger_service_1 = require("./common/services/logger.service");
const shutdown_service_1 = require("./common/services/shutdown.service");
const dashboard_csp_1 = require("./config/dashboard-csp");
const bootstrap_security_1 = require("./config/bootstrap-security");
const http_timeouts_1 = require("./config/http-timeouts");
const ip_1 = require("./common/utils/ip");
const body_nesting_1 = require("./common/validation/body-nesting");
function configureApp(app, options = {}) {
    const dashboard = options.dashboard ?? {
        distDir: app_module_1.DASHBOARD_DIST,
        enabled: app_module_1.dashboardServingEnabled && app_module_1.dashboardBuildPresent,
    };
    app.use(request_context_middleware_1.requestContextMiddleware);
    app.use((req, res, next) => {
        res.locals.cspNonce = (0, crypto_1.randomBytes)(18).toString('base64url');
        next();
    });
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'", (_req, res) => `'nonce-${res.locals.cspNonce}'`],
                imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
                mediaSrc: ["'self'", 'data:', 'blob:', 'https:'],
                connectSrc: ["'self'"],
                fontSrc: ["'self'"],
                objectSrc: ["'none'"],
                upgradeInsecureRequests: (0, bootstrap_security_1.isUpgradeInsecureRequestsEnabled)(process.env.CSP_UPGRADE_INSECURE_REQUESTS, process.env.NODE_ENV)
                    ? []
                    : null,
            },
        },
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
        },
        noSniff: true,
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
        crossOriginResourcePolicy: { policy: 'cross-origin' },
    }));
    if (dashboard.enabled && (0, fs_1.existsSync)((0, path_1.join)(dashboard.distDir, 'index.html'))) {
        const dashboardIndex = (0, fs_1.readFileSync)((0, path_1.join)(dashboard.distDir, 'index.html'), 'utf8');
        app.use((req, res, next) => {
            const path = req.path.toLowerCase();
            const excluded = path.startsWith('/api/') ||
                path === '/api' ||
                path.startsWith('/socket.io/') ||
                path === '/socket.io' ||
                path.startsWith('/mcp/') ||
                path === '/mcp' ||
                path.startsWith('/assets/');
            const documentRequest = req.method === 'GET' &&
                !excluded &&
                ((req.headers.accept ?? '').includes('text/html') || (0, path_1.extname)(req.path) === '');
            if (!documentRequest)
                return next();
            res.setHeader('Cache-Control', 'no-store');
            res.type('html').send((0, dashboard_csp_1.injectDashboardCspNonce)(dashboardIndex, res.locals.cspNonce));
        });
    }
    const corsPolicy = (0, bootstrap_security_1.resolveCorsPolicy)(process.env.CORS_ORIGINS, process.env.NODE_ENV);
    if (process.env.NODE_ENV === 'production' && corsPolicy.origins.length === 0 && !corsPolicy.allowAnyOrigin) {
        (0, logger_service_1.createLogger)('Bootstrap').warn('No explicit CORS_ORIGINS in production (wildcard "*" is refused): cross-origin browser ' +
            'requests will be blocked. Set CORS_ORIGINS to your dashboard origin(s).');
    }
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin)
                return callback(null, true);
            if (corsPolicy.allowAnyOrigin || corsPolicy.origins.includes(origin)) {
                callback(null, true);
            }
            else {
                callback(null, false);
            }
        },
        credentials: corsPolicy.credentials,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'X-API-Key', 'Authorization', 'X-Request-ID', 'Idempotency-Key'],
        exposedHeaders: [
            'X-RateLimit-Limit-short',
            'X-RateLimit-Remaining-short',
            'X-RateLimit-Reset-short',
            'X-RateLimit-Limit-medium',
            'X-RateLimit-Remaining-medium',
            'X-RateLimit-Reset-medium',
            'X-RateLimit-Limit-long',
            'X-RateLimit-Remaining-long',
            'X-RateLimit-Reset-long',
            'X-RateLimit-Limit-instance',
            'X-RateLimit-Remaining-instance',
            'X-RateLimit-Reset-instance',
            'X-RateLimit-Limit-ingress-ip',
            'X-RateLimit-Remaining-ingress-ip',
            'X-RateLimit-Reset-ingress-ip',
            'Retry-After',
            'Retry-After-short',
            'Retry-After-medium',
            'Retry-After-long',
            'Retry-After-instance',
            'Retry-After-ingress-ip',
            'Idempotent-Replayed',
        ],
        maxAge: 86400,
    });
    app.use((req, res, next) => {
        if (!req.originalUrl.includes('%00'))
            return next();
        res.status(400).json({ statusCode: 400, message: 'URL must not contain an encoded NUL', error: 'Bad Request' });
    });
    const optional = (token) => {
        try {
            return app.get(core_1.ModuleRef).get(token, { strict: false });
        }
        catch {
            return undefined;
        }
    };
    const shutdown = optional(shutdown_service_1.ShutdownService);
    app.use((req, res, next) => {
        if (!shutdown?.isTearingDown())
            return next();
        const path = req.path.toLowerCase();
        if (path === '/api/health' || path.startsWith('/api/health/'))
            return next();
        res.status(503).set('Connection', 'close').json({
            statusCode: 503,
            message: 'Server is shutting down',
            error: 'Service Unavailable',
        });
    });
    const inflightBudgetBytes = (0, inflight_body_budget_1.resolveInflightBodyBudgetBytes)(process.env.INFLIGHT_BODY_BUDGET_BYTES, process.env.BODY_SIZE_LIMIT);
    const bodyLimit = (0, bootstrap_security_1.resolveBodyLimit)(process.env.BODY_SIZE_LIMIT);
    const keyIndex = optional(active_key_index_1.ActiveKeyIndex);
    app.use((0, inflight_body_budget_1.createInflightBodyBudget)(inflightBudgetBytes, {
        trustedProxies: (0, ip_1.parseTrustedProxies)(process.env.TRUSTED_PROXIES),
        classify: (req, clientIp) => keyIndex?.recognise(req.headers, clientIp),
        bodyLimitBytes: (0, inflight_body_budget_1.parseBodyLimitBytes)(bodyLimit),
        requestTimeoutMs: (0, http_timeouts_1.resolveRequestTimeoutMs)(process.env.REQUEST_TIMEOUT_MS),
    }).middleware);
    app.use((0, express_1.json)({
        limit: bodyLimit,
        inflate: false,
        verify: (req, _res, buf, encoding) => {
            req.rawBody = buf;
            if ((0, body_nesting_1.isUtf8Charset)(encoding)) {
                if ((0, body_nesting_1.exceedsJsonNesting)(buf))
                    throw new common_1.BadRequestException(body_nesting_1.BODY_NESTING_MESSAGE);
                req.nestingScanned = true;
            }
        },
    }));
    app.use((0, express_1.urlencoded)({
        extended: true,
        limit: bodyLimit,
        inflate: false,
        verify: (req, _res, buf) => {
            req.rawBody = buf;
        },
    }));
    app.use((req, _res, next) => {
        if (req.nestingScanned || !(0, body_nesting_1.exceedsBodyNesting)(req.body))
            return next();
        next(new common_1.BadRequestException(body_nesting_1.BODY_NESTING_MESSAGE));
    });
    app.use((req, res, next) => {
        const path = req.path.toLowerCase();
        if (req.method === 'DELETE' &&
            path.startsWith('/api/') &&
            !path.startsWith('/api/ingress/') &&
            path.endsWith('/')) {
            res.status(404).json({ statusCode: 404, message: `Cannot DELETE ${req.path}`, error: 'Not Found' });
            return;
        }
        next();
    });
    return { bodyLimit, inflightBudgetBytes };
}
//# sourceMappingURL=configure-app.js.map