"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedriveController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_decorators_1 = require("../auth/decorators/auth.decorators");
const api_key_entity_1 = require("../auth/entities/api-key.entity");
const audit_log_entity_1 = require("../audit/entities/audit-log.entity");
const audit_service_1 = require("../audit/audit.service");
const session_scope_1 = require("../../common/security/session-scope");
const plugin_instance_service_1 = require("./plugin-instance.service");
const redrive_service_1 = require("./redrive.service");
const instance_dto_1 = require("./dto/instance.dto");
let RedriveController = class RedriveController {
    redrive;
    instances;
    audit;
    constructor(redrive, instances, audit) {
        this.redrive = redrive;
        this.instances = instances;
        this.audit = audit;
    }
    async redriveInstance(pluginId, instanceId, apiKey) {
        const inst = await this.instances.resolve(pluginId, instanceId);
        const scoped = (apiKey?.allowedSessions?.length ?? 0) > 0;
        if (scoped && (!inst || !(0, session_scope_1.sessionScopeVisible)(apiKey?.allowedSessions, inst.sessionScope))) {
            throw new common_1.NotFoundException('instance not found');
        }
        if (!inst || inst.enabled === false) {
            throw new common_1.ConflictException(`instance ${instanceId} of plugin ${pluginId} is ${inst ? 'disabled' : 'deleted'}; its dead-lettered deliveries cannot be redriven`);
        }
        const result = await this.redrive.redriveInstance(pluginId, instanceId, inst.sessionScope);
        void this.audit.logInfo(audit_log_entity_1.AuditAction.INTEGRATION_INSTANCE_REDRIVEN, {
            metadata: { pluginId, instanceId, redriven: result.redriven, remaining: result.remaining },
        });
        return result;
    }
};
exports.RedriveController = RedriveController;
__decorate([
    (0, common_1.Post)(':pluginId/:instanceId/redrive'),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'One bounded batch of dead-lettered ingress deliveries re-dispatched, with remaining depth.',
        type: instance_dto_1.RedriveResultDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: "Session-restricted key: the instance does not exist or is bound outside the key's allowedSessions.",
    }),
    (0, swagger_1.ApiResponse)({
        status: 409,
        description: 'The instance is disabled or deleted; its dead-lettered deliveries cannot be re-dispatched.',
    }),
    __param(0, (0, common_1.Param)('pluginId')),
    __param(1, (0, common_1.Param)('instanceId')),
    __param(2, (0, auth_decorators_1.CurrentApiKey)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Function]),
    __metadata("design:returntype", Promise)
], RedriveController.prototype, "redriveInstance", null);
exports.RedriveController = RedriveController = __decorate([
    (0, swagger_1.ApiTags)('integration'),
    (0, common_1.Controller)('integration/instances'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.ADMIN),
    __metadata("design:paramtypes", [redrive_service_1.RedriveService,
        plugin_instance_service_1.PluginInstanceService,
        audit_service_1.AuditService])
], RedriveController);
//# sourceMappingURL=redrive.controller.js.map