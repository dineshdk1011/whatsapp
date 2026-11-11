"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const typeorm_1 = require("@nestjs/typeorm");
const session_entity_1 = require("./entities/session.entity");
const message_entity_1 = require("../message/entities/message.entity");
const session_service_1 = require("./session.service");
const session_auth_dir_migration_service_1 = require("./session-auth-dir-migration.service");
const session_engine_lifecycle_service_1 = require("./session-engine-lifecycle.service");
const session_lid_resolver_service_1 = require("./session-lid-resolver.service");
const session_liveness_watchdog_service_1 = require("./session-liveness-watchdog.service");
const session_ownership_service_1 = require("./session-ownership.service");
const session_proxy_interceptor_1 = require("./session-proxy.interceptor");
const message_projector_service_1 = require("./message-projector.service");
const session_error_store_service_1 = require("./session-error-store.service");
const session_restriction_store_service_1 = require("./session-restriction-store.service");
const presence_store_service_1 = require("./presence-store.service");
const session_controller_1 = require("./session.controller");
const webhook_module_1 = require("../webhook/webhook.module");
const status_store_module_1 = require("../status-store/status-store.module");
const chat_media_module_1 = require("../chat-media/chat-media.module");
const automation_module_1 = require("../automation/automation.module");
const plugin_host_ports_1 = require("../../core/plugins/plugin-host-ports");
let SessionModule = class SessionModule {
};
exports.SessionModule = SessionModule;
exports.SessionModule = SessionModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([session_entity_1.Session, message_entity_1.Message], 'data'),
            webhook_module_1.WebhookModule,
            status_store_module_1.StatusStoreModule,
            chat_media_module_1.ChatMediaModule,
            automation_module_1.AutomationModule,
        ],
        controllers: [session_controller_1.SessionController],
        providers: [
            { provide: core_1.APP_INTERCEPTOR, useClass: session_proxy_interceptor_1.SessionProxyInterceptor },
            session_service_1.SessionService,
            session_auth_dir_migration_service_1.SessionAuthDirMigration,
            session_engine_lifecycle_service_1.SessionEngineLifecycle,
            session_error_store_service_1.SessionErrorStore,
            session_restriction_store_service_1.SessionRestrictionStore,
            presence_store_service_1.PresenceStore,
            session_lid_resolver_service_1.SessionLidResolver,
            session_liveness_watchdog_service_1.SessionLivenessWatchdog,
            session_ownership_service_1.SessionOwnershipService,
            message_projector_service_1.MessageProjector,
            { provide: plugin_host_ports_1.PLUGIN_SESSION_PORT, useExisting: session_service_1.SessionService },
        ],
        exports: [session_service_1.SessionService, message_projector_service_1.MessageProjector, session_ownership_service_1.SessionOwnershipService],
    })
], SessionModule);
//# sourceMappingURL=session.module.js.map