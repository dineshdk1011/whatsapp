"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstanceThrottlerGuard = void 0;
const common_1 = require("@nestjs/common");
const proxy_aware_throttler_guard_1 = require("../../common/security/proxy-aware-throttler.guard");
const configuration_1 = require("../../config/configuration");
let InstanceThrottlerGuard = class InstanceThrottlerGuard extends proxy_aware_throttler_guard_1.ProxyAwareThrottlerGuard {
    async onModuleInit() {
        await super.onModuleInit();
        this.throttlers = [
            {
                name: 'ingress-ip',
                limit: (0, configuration_1.resolveNonNegativeIntEnv)(process.env.INGRESS_IP_LIMIT, 1200),
                ttl: (0, configuration_1.resolveNonNegativeIntEnv)(process.env.INGRESS_INSTANCE_TTL, 60000),
            },
        ];
    }
    shouldSkip() {
        return Promise.resolve(false);
    }
};
exports.InstanceThrottlerGuard = InstanceThrottlerGuard;
exports.InstanceThrottlerGuard = InstanceThrottlerGuard = __decorate([
    (0, common_1.Injectable)()
], InstanceThrottlerGuard);
//# sourceMappingURL=instance-throttler.guard.js.map