"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const core_1 = require("@nestjs/core");
const api_key_entity_1 = require("./entities/api-key.entity");
const auth_service_1 = require("./auth.service");
const api_key_usage_tracker_service_1 = require("./api-key-usage-tracker.service");
const chat_scope_service_1 = require("./chat-scope.service");
const active_key_index_1 = require("./active-key-index");
const auth_controller_1 = require("./auth.controller");
const auth_validate_controller_1 = require("./auth-validate.controller");
const api_key_guard_1 = require("./guards/api-key.guard");
const proxy_aware_throttler_guard_1 = require("../../common/security/proxy-aware-throttler.guard");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([api_key_entity_1.ApiKey], 'main')],
        controllers: [auth_controller_1.AuthController, auth_validate_controller_1.AuthValidateController],
        providers: [
            auth_service_1.AuthService,
            api_key_usage_tracker_service_1.ApiKeyUsageTracker,
            chat_scope_service_1.ChatScopeService,
            active_key_index_1.ActiveKeyIndex,
            {
                provide: core_1.APP_GUARD,
                useClass: proxy_aware_throttler_guard_1.ProxyAwareThrottlerGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: api_key_guard_1.ApiKeyGuard,
            },
        ],
        exports: [auth_service_1.AuthService, chat_scope_service_1.ChatScopeService, active_key_index_1.ActiveKeyIndex],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map