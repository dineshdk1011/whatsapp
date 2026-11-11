"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("./config/load-env");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const shutdown_service_1 = require("./common/services/shutdown.service");
const logger_service_1 = require("./common/services/logger.service");
const swagger_config_1 = require("./config/swagger.config");
const process_error_monitor_1 = require("./config/process-error-monitor");
const bootstrap_fatal_1 = require("./config/bootstrap-fatal");
const stop_signals_1 = require("./config/stop-signals");
const env_validation_1 = require("./config/env.validation");
const ssrf_guard_1 = require("./common/security/ssrf-guard");
const storage_root_1 = require("./config/storage-root");
const http_timeouts_1 = require("./config/http-timeouts");
const app_validation_1 = require("./config/app-validation");
const configure_app_1 = require("./configure-app");
const bootstrap_security_1 = require("./config/bootstrap-security");
const bull_board_auth_middleware_1 = require("./common/security/bull-board-auth.middleware");
const ip_1 = require("./common/utils/ip");
const auth_service_1 = require("./modules/auth/auth.service");
const audit_service_1 = require("./modules/audit/audit.service");
const redis_io_adapter_1 = require("./modules/events/redis-io.adapter");
const docker_service_1 = require("./modules/docker/docker.service");
let appInstance;
async function bootstrap() {
    (0, logger_service_1.applyLogLevelFromEnv)();
    const bootstrapLogger = (0, logger_service_1.createLogger)('Bootstrap');
    (0, process_error_monitor_1.registerUnhandledRejectionHandler)(bootstrapLogger);
    (0, process_error_monitor_1.registerUncaughtExceptionMonitor)(bootstrapLogger);
    (0, env_validation_1.validateEnv)(process.env);
    const s3EndpointProblem = (0, env_validation_1.s3EndpointError)(process.env);
    if (s3EndpointProblem) {
        bootstrapLogger.error(`${s3EndpointProblem}. Until then S3 is unavailable and media is written to the local directory.`);
    }
    (0, ssrf_guard_1.warnUnusableAllowedHosts)();
    if ((0, bootstrap_security_1.isNodeEnvUnset)(process.env.NODE_ENV)) {
        bootstrapLogger.warn('NODE_ENV is not set: running with development defaults — the default-secret guard is skipped, ' +
            'wildcard CORS is allowed, Swagger UI is served, and validation error detail is exposed. ' +
            'Set NODE_ENV=production for a production deployment.');
    }
    (0, bootstrap_security_1.assertNoDefaultSecretsInProduction)({
        nodeEnv: process.env.NODE_ENV,
        databaseType: process.env.DATABASE_TYPE,
        databasePassword: process.env.DATABASE_PASSWORD,
        postgresBuiltIn: process.env.POSTGRES_BUILTIN,
        databaseHost: process.env.DATABASE_HOST,
        storageType: process.env.STORAGE_TYPE,
        minioBuiltIn: process.env.MINIO_BUILTIN,
        s3Endpoint: process.env.S3_ENDPOINT,
        s3AccessKey: process.env.S3_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY,
        s3SecretKey: process.env.S3_SECRET_ACCESS_KEY || process.env.S3_SECRET_KEY,
        apiMasterKey: process.env.API_MASTER_KEY,
        allowDevApiKey: process.env.ALLOW_DEV_API_KEY,
        redisPassword: process.env.REDIS_PASSWORD,
        metricsToken: process.env.METRICS_TOKEN,
    });
    if ((0, bootstrap_security_1.isApiKeyPepperMissingInProduction)(process.env.NODE_ENV, process.env.API_KEY_PEPPER)) {
        bootstrapLogger.warn('API_KEY_PEPPER is not set in production: stored API-key hashes use plain SHA-256. ' +
            'Set API_KEY_PEPPER before the first boot to enable HMAC hashing; on an install with keys it locks out ' +
            'every key until the previous pepper is restored, or api_keys is cleared and the instance restarted to ' +
            'seed a new admin key.');
    }
    if ((0, bootstrap_security_1.isMainDbSynchronizeInProduction)(process.env.NODE_ENV, process.env.MAIN_DATABASE_SYNCHRONIZE)) {
        bootstrapLogger.warn('MAIN_DATABASE_SYNCHRONIZE=true in production: after its migrations the auth/audit schema is also ' +
            "synchronized to this release's entities, and those changes are not recorded in the migration ledger. " +
            'Unset it to use the main migrations alone.');
    }
    const badTrustedProxies = (0, ip_1.invalidTrustedProxies)(process.env.TRUSTED_PROXIES);
    if (badTrustedProxies.length > 0) {
        bootstrapLogger.warn(`TRUSTED_PROXIES entries that are not an IP address or CIDR range are ignored: ${badTrustedProxies.join(', ')}`);
    }
    const rewrittenOrigins = (0, bootstrap_security_1.rewrittenCorsOrigins)(process.env.CORS_ORIGINS);
    if (rewrittenOrigins.length > 0) {
        bootstrapLogger.warn(`CORS_ORIGINS entries are used as an origin, without their path or trailing slash: ${rewrittenOrigins.join(', ')}`);
    }
    process.env.STORAGE_LOCAL_PATH = (0, storage_root_1.resolveStorageRoot)({
        configured: process.env.STORAGE_LOCAL_PATH,
        logger: bootstrapLogger,
    });
    await (0, docker_service_1.prestartBuiltinDatabase)();
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        bodyParser: false,
        logger: (0, logger_service_1.createLogger)('Nest'),
        forceCloseConnections: true,
    });
    appInstance = app;
    app.useWebSocketAdapter(new redis_io_adapter_1.RedisIoAdapter(app));
    const { bodyLimit, inflightBudgetBytes } = (0, configure_app_1.configureApp)(app);
    bootstrapLogger.log(`Request body caps: ${bodyLimit} per request, ${inflightBudgetBytes} bytes aggregate in flight`);
    app.enableShutdownHooks(Object.values(common_1.ShutdownSignal).filter(s => s !== common_1.ShutdownSignal.SIGTERM && s !== common_1.ShutdownSignal.SIGINT));
    const shutdownService = app.get(shutdown_service_1.ShutdownService);
    shutdownService.setShutdownCallback(async () => {
        await app.close();
    });
    (0, stop_signals_1.installStopSignalHandlers)({ shutdown: () => shutdownService.shutdown() });
    (0, app_validation_1.applyGlobalValidation)(app);
    const swaggerEnabled = (0, bootstrap_security_1.isSwaggerEnabled)(process.env.ENABLE_SWAGGER, process.env.NODE_ENV);
    if (swaggerEnabled) {
        const config = (0, swagger_config_1.createSwaggerConfig)();
        const document = swagger_1.SwaggerModule.createDocument(app, config);
        (0, swagger_config_1.dropUnexpressibleOperations)(document);
        (0, swagger_config_1.exemptPublicOperations)(document);
        (0, swagger_config_1.documentErrorResponses)(document);
        swagger_1.SwaggerModule.setup('api/docs', app, document);
    }
    const bullBoardAuth = new bull_board_auth_middleware_1.BullBoardAuthMiddleware(app.get(auth_service_1.AuthService), app.get(config_1.ConfigService), app.get(audit_service_1.AuditService));
    app.use('/api/admin/queues', (req, res, next) => {
        void bullBoardAuth.use(req, res, next);
    });
    const appliedHttpTimeouts = (0, http_timeouts_1.applyHttpTimeouts)(app.getHttpServer(), app.get(config_1.ConfigService).get('http'));
    bootstrapLogger.log(`HTTP server timeouts applied: requestTimeout=${appliedHttpTimeouts.requestTimeoutMs}ms ` +
        `headersTimeout=${appliedHttpTimeouts.headersTimeoutMs}ms keepAliveTimeout=${appliedHttpTimeouts.keepAliveTimeoutMs}ms`);
    const port = process.env.PORT || 2785;
    await app.listen(port);
    const publicUrl = process.env.BASE_URL || `http://localhost:${port}`;
    bootstrapLogger.log(`OpenWA is running on: ${publicUrl}`);
    if (swaggerEnabled) {
        bootstrapLogger.log(`Swagger docs: ${publicUrl}/api/docs`);
    }
    if (!app_module_1.dashboardServingEnabled) {
        bootstrapLogger.log('Dashboard: serving disabled (SERVE_DASHBOARD=false); API only');
    }
    else if (app_module_1.dashboardBuildPresent) {
        bootstrapLogger.log(`Dashboard: serving bundled UI at ${publicUrl}`);
    }
    else {
        bootstrapLogger.warn(`Dashboard: no build at ${app_module_1.DASHBOARD_DIST} - UI disabled (API still serves /api). ` +
            'Run `npm run build:all` to bundle it, or use the Vite dev server (`npm run dev`).');
    }
    if ((0, bootstrap_security_1.isDashboardCspUpgradeTrapLikely)({
        nodeEnv: process.env.NODE_ENV,
        cspEnv: process.env.CSP_UPGRADE_INSECURE_REQUESTS,
        dashboardServed: app_module_1.dashboardServingEnabled && app_module_1.dashboardBuildPresent,
    })) {
        bootstrapLogger.warn('Dashboard: CSP upgrade-insecure-requests is ON (production default). If this instance is ' +
            "reached over plain HTTP, the browser will upgrade the UI's scripts to https:// and the " +
            'dashboard will render blank. Behind a TLS proxy? Ignore this. Serving direct HTTP? Set ' +
            'CSP_UPGRADE_INSECURE_REQUESTS=false.');
    }
}
void (0, bootstrap_fatal_1.runBootstrapOrExit)(bootstrap, {
    logger: (0, logger_service_1.createLogger)('Bootstrap'),
    closeApp: () => (appInstance ? appInstance.close() : Promise.resolve()),
});
//# sourceMappingURL=main.js.map