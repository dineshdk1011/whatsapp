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
exports.AuditController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const audit_response_dto_1 = require("./dto/audit-response.dto");
const audit_service_1 = require("./audit.service");
const audit_log_entity_1 = require("./entities/audit-log.entity");
const auth_decorators_1 = require("../auth/decorators/auth.decorators");
const api_key_entity_1 = require("../auth/entities/api-key.entity");
let AuditController = class AuditController {
    auditService;
    constructor(auditService) {
        this.auditService = auditService;
    }
    async findAll(apiKey, action, severity, sessionId, apiKeyId, limit, offset) {
        if (action && !Object.values(audit_log_entity_1.AuditAction).includes(action)) {
            throw new common_1.BadRequestException('action must be a single value from the AuditAction list');
        }
        if (severity && !Object.values(audit_log_entity_1.AuditSeverity).includes(severity)) {
            throw new common_1.BadRequestException(`severity must be a single value, one of: ${Object.values(audit_log_entity_1.AuditSeverity).join(', ')}`);
        }
        const options = {};
        if (action)
            options.action = action;
        if (severity)
            options.severity = severity;
        if (sessionId)
            options.sessionId = sessionId;
        if (apiKeyId)
            options.apiKeyId = apiKeyId;
        if (limit)
            options.limit = parseInt(limit, 10);
        if (offset)
            options.offset = parseInt(offset, 10);
        return this.auditService.findAll(options, apiKey?.allowedSessions);
    }
};
exports.AuditController = AuditController;
__decorate([
    (0, common_1.Get)(),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'List audit logs with optional filters' }),
    (0, swagger_1.ApiQuery)({ name: 'action', required: false, enum: audit_log_entity_1.AuditAction }),
    (0, swagger_1.ApiQuery)({
        name: 'severity',
        required: false,
        enum: audit_log_entity_1.AuditSeverity,
        description: '`error` is reserved: nothing writes it, so that filter returns no rows.',
    }),
    (0, swagger_1.ApiQuery)({ name: 'sessionId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'apiKeyId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: 'integer' }),
    (0, swagger_1.ApiQuery)({ name: 'offset', required: false, type: 'integer' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Paginated list of audit logs', type: audit_response_dto_1.AuditListResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'action or severity is repeated or not one of the listed values' }),
    __param(0, (0, auth_decorators_1.CurrentApiKey)()),
    __param(1, (0, common_1.Query)('action')),
    __param(2, (0, common_1.Query)('severity')),
    __param(3, (0, common_1.Query)('sessionId')),
    __param(4, (0, common_1.Query)('apiKeyId')),
    __param(5, (0, common_1.Query)('limit')),
    __param(6, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [api_key_entity_1.ApiKey, Object, Object, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "findAll", null);
exports.AuditController = AuditController = __decorate([
    (0, swagger_1.ApiTags)('audit'),
    (0, common_1.Controller)('audit'),
    __metadata("design:paramtypes", [audit_service_1.AuditService])
], AuditController);
//# sourceMappingURL=audit.controller.js.map