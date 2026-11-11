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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = exports.DASHBOARD_STATIC_OPTIONS = exports.dashboardBuildPresent = exports.dashboardServingEnabled = exports.DASHBOARD_DIST = void 0;
const common_1 = require("@nestjs/common");
const serve_static_1 = require("@nestjs/serve-static");
const config_1 = require("@nestjs/config");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const typeorm_1 = require("@nestjs/typeorm");
const throttler_1 = require("@nestjs/throttler");
const redis_throttler_storage_1 = require("./common/throttler/redis-throttler.storage");
const throttler_redis_client_1 = require("./common/throttler/throttler-redis.client");
const configuration_1 = __importDefault(require("./config/configuration"));
const env_validation_1 = require("./config/env.validation");
const pg_boot_migrations_1 = require("./database/pg-boot-migrations");
const main_connection_1 = require("./database/main-connection");
const session_module_1 = require("./modules/session/session.module");
const message_module_1 = require("./modules/message/message.module");
const template_module_1 = require("./modules/template/template.module");
const webhook_module_1 = require("./modules/webhook/webhook.module");
const health_module_1 = require("./modules/health/health.module");
const auth_module_1 = require("./modules/auth/auth.module");
const audit_module_1 = require("./modules/audit/audit.module");
const engine_module_1 = require("./engine/engine.module");
const logger_module_1 = require("./common/services/logger.module");
const settings_module_1 = require("./modules/settings/settings.module");
const infra_module_1 = require("./modules/infra/infra.module");
const events_module_1 = require("./modules/events/events.module");
const contact_module_1 = require("./modules/contact/contact.module");
const group_module_1 = require("./modules/group/group.module");
const profile_module_1 = require("./modules/profile/profile.module");
const call_module_1 = require("./modules/call/call.module");
const label_module_1 = require("./modules/label/label.module");
const channel_module_1 = require("./modules/channel/channel.module");
const cache_1 = require("./common/cache");
const storage_module_1 = require("./common/storage/storage.module");
const stats_module_1 = require("./modules/stats/stats.module");
const metrics_module_1 = require("./modules/metrics/metrics.module");
const status_module_1 = require("./modules/status/status.module");
const media_module_1 = require("./modules/media/media.module");
const status_store_module_1 = require("./modules/status-store/status-store.module");
const chat_media_module_1 = require("./modules/chat-media/chat-media.module");
const automation_module_1 = require("./modules/automation/automation.module");
const takeover_module_1 = require("./modules/takeover/takeover.module");
const catalog_module_1 = require("./modules/catalog/catalog.module");
const hooks_1 = require("./core/hooks");
const plugins_1 = require("./core/plugins");
const plugins_module_1 = require("./modules/plugins/plugins.module");
const agent_tools_module_1 = require("./core/agent-tools/agent-tools.module");
const integration_module_1 = require("./modules/integration/integration.module");
const search_module_1 = require("./modules/search/search.module");
const sqlite_file_permissions_1 = require("./database/sqlite-file-permissions");
const queueModules = [];
if (process.env.QUEUE_ENABLED === 'true') {
    const queueModule = require('./modules/queue/queue.module');
    queueModules.push(queueModule.QueueModule);
}
const searchModules = [];
if (process.env.SEARCH_ENABLED !== 'false') {
    searchModules.push(search_module_1.SearchModule);
}
const mcpModules = [];
if (process.env.MCP_ENABLED === 'true') {
    const { McpModule } = require('./modules/mcp/mcp.module');
    const { version } = require('../package.json');
    mcpModules.push(McpModule.forRoot({
        basePath: '/mcp',
        serverInfo: { name: 'openwa', version },
    }));
}
exports.DASHBOARD_DIST = path.resolve(__dirname, '..', 'dashboard', 'dist');
exports.dashboardServingEnabled = process.env.SERVE_DASHBOARD !== 'false';
exports.dashboardBuildPresent = fs.existsSync(path.join(exports.DASHBOARD_DIST, 'index.html'));
exports.DASHBOARD_STATIC_OPTIONS = {
    renderPath: '/__openwa_spa_fallback_owned_by_main_ts__',
};
const serveStaticModules = [];
if (exports.dashboardServingEnabled && exports.dashboardBuildPresent) {
    serveStaticModules.push(serve_static_1.ServeStaticModule.forRoot({ rootPath: exports.DASHBOARD_DIST, ...exports.DASHBOARD_STATIC_OPTIONS }));
}
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [configuration_1.default],
                validate: env_validation_1.validateEnv,
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                name: 'main',
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => (0, main_connection_1.mainConnectionOptions)(configService),
                dataSourceFactory: main_connection_1.createMainDataSource,
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                name: 'data',
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                dataSourceFactory: pg_boot_migrations_1.createBootDataSource,
                useFactory: (configService) => {
                    const dbType = configService.get('dataDatabase.type', 'sqlite');
                    const baseConfig = {
                        entities: [
                            __dirname + '/modules/session/**/*.entity{.ts,.js}',
                            __dirname + '/modules/webhook/**/*.entity{.ts,.js}',
                            __dirname + '/modules/message/**/*.entity{.ts,.js}',
                            __dirname + '/modules/template/**/*.entity{.ts,.js}',
                            __dirname + '/engine/**/*.entity{.ts,.js}',
                            __dirname + '/modules/integration/**/*.entity{.ts,.js}',
                            __dirname + '/modules/status-store/**/*.entity{.ts,.js}',
                            __dirname + '/modules/automation/**/*.entity{.ts,.js}',
                        ],
                        migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
                        logging: configService.get('dataDatabase.logging', false),
                    };
                    if (dbType === 'postgres') {
                        const schema = configService.get('dataDatabase.schema', 'public');
                        const useCustomSearchPath = schema && schema !== 'public';
                        return {
                            ...baseConfig,
                            name: 'data',
                            type: 'postgres',
                            schema,
                            host: configService.get('dataDatabase.host'),
                            port: configService.get('dataDatabase.port'),
                            username: configService.get('dataDatabase.username'),
                            password: configService.get('dataDatabase.password'),
                            database: configService.get('dataDatabase.name', 'openwa'),
                            ssl: configService.get('dataDatabase.ssl', false)
                                ? {
                                    rejectUnauthorized: configService.get('dataDatabase.sslRejectUnauthorized', true),
                                }
                                : false,
                            synchronize: configService.get('dataDatabase.synchronize', false),
                            migrationsRun: true,
                            retryAttempts: 10,
                            retryDelay: 3000,
                            extra: {
                                max: configService.get('dataDatabase.poolSize', 10),
                                statement_timeout: configService.get('dataDatabase.statementTimeoutMs', 30000),
                                idleTimeoutMillis: configService.get('dataDatabase.idleTimeoutMs', 30000),
                                connectionTimeoutMillis: configService.get('dataDatabase.connectionTimeoutMs', 10000),
                                ...(useCustomSearchPath ? { options: `-c search_path=${schema},public` } : {}),
                            },
                        };
                    }
                    const synchronize = configService.get('dataDatabase.synchronize', false);
                    return {
                        ...baseConfig,
                        name: 'data',
                        type: 'better-sqlite3',
                        database: configService.get('dataDatabase.database', './data/openwa.sqlite'),
                        timeout: main_connection_1.SQLITE_BUSY_TIMEOUT_MS,
                        synchronize,
                        migrationsRun: !synchronize,
                    };
                },
            }),
            throttler_1.ThrottlerModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => {
                    const throttlers = [
                        {
                            name: 'short',
                            ttl: configService.get('api.rateLimit.shortTtl', 1000),
                            limit: configService.get('api.rateLimit.shortLimit', 10),
                        },
                        {
                            name: 'medium',
                            ttl: configService.get('api.rateLimit.mediumTtl', 60000),
                            limit: configService.get('api.rateLimit.mediumLimit', 100),
                        },
                        {
                            name: 'long',
                            ttl: configService.get('api.rateLimit.longTtl', 3600000),
                            limit: configService.get('api.rateLimit.longLimit', 1000),
                        },
                    ];
                    const redisStorage = process.env.REDIS_ENABLED === 'true' ? new redis_throttler_storage_1.RedisThrottlerStorage((0, throttler_redis_client_1.createThrottlerRedisClient)()) : undefined;
                    return { throttlers, ...(redisStorage ? { storage: redisStorage } : {}) };
                },
            }),
            hooks_1.HooksModule,
            plugins_1.PluginsModule,
            logger_module_1.LoggerModule,
            cache_1.CacheModule,
            storage_module_1.StorageModule,
            audit_module_1.AuditModule,
            events_module_1.EventsModule,
            ...queueModules,
            auth_module_1.AuthModule,
            engine_module_1.EngineModule,
            session_module_1.SessionModule,
            message_module_1.MessageModule,
            template_module_1.TemplateModule,
            webhook_module_1.WebhookModule,
            health_module_1.HealthModule,
            settings_module_1.SettingsModule,
            infra_module_1.InfraModule,
            contact_module_1.ContactModule,
            group_module_1.GroupModule,
            profile_module_1.ProfileModule,
            call_module_1.CallModule,
            label_module_1.LabelModule,
            channel_module_1.ChannelModule,
            stats_module_1.StatsModule,
            metrics_module_1.MetricsModule,
            status_module_1.StatusModule,
            media_module_1.MediaModule,
            status_store_module_1.StatusStoreModule,
            chat_media_module_1.ChatMediaModule,
            automation_module_1.AutomationModule,
            takeover_module_1.TakeoverModule,
            catalog_module_1.CatalogModule,
            plugins_module_1.PluginsApiModule,
            agent_tools_module_1.AgentToolsModule,
            integration_module_1.IntegrationModule,
            ...searchModules,
            ...mcpModules,
            ...serveStaticModules,
        ],
        providers: [sqlite_file_permissions_1.SqlitePermissionsBoot],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map