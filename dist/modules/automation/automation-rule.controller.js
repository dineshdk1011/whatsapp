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
exports.AutomationRuleController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_decorators_1 = require("../auth/decorators/auth.decorators");
const api_key_entity_1 = require("../auth/entities/api-key.entity");
const automation_rules_service_1 = require("./automation-rules.service");
const automation_rule_dto_1 = require("./dto/automation-rule.dto");
let AutomationRuleController = class AutomationRuleController {
    automationRules;
    constructor(automationRules) {
        this.automationRules = automationRules;
    }
    async create(sessionId, dto) {
        return automation_rule_dto_1.AutomationRuleResponseDto.fromEntity(await this.automationRules.create(sessionId, dto));
    }
    async findAll(sessionId) {
        return (await this.automationRules.findAll(sessionId)).map(rule => automation_rule_dto_1.AutomationRuleResponseDto.fromEntity(rule));
    }
    async findOne(sessionId, ruleId) {
        return automation_rule_dto_1.AutomationRuleResponseDto.fromEntity(await this.automationRules.findOne(sessionId, ruleId));
    }
    async update(sessionId, ruleId, dto) {
        return automation_rule_dto_1.AutomationRuleResponseDto.fromEntity(await this.automationRules.update(sessionId, ruleId, dto));
    }
    async remove(sessionId, ruleId) {
        await this.automationRules.remove(sessionId, ruleId);
    }
};
exports.AutomationRuleController = AutomationRuleController;
__decorate([
    (0, common_1.Post)(),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Create an autoreply rule' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Rule created.', type: automation_rule_dto_1.AutomationRuleResponseDto }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Invalid rule (bad conditions, over-limit text, out-of-range cooldown), or the per-session rule limit is reached.',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'No session with this id.' }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, automation_rule_dto_1.CreateAutomationRuleDto]),
    __metadata("design:returntype", Promise)
], AutomationRuleController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'List the session’s autoreply rules' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Rules in evaluation order: creation time, id as the same-second tiebreak.',
        type: automation_rule_dto_1.AutomationRuleResponseDto,
        isArray: true,
    }),
    __param(0, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AutomationRuleController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':ruleId'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Get one autoreply rule' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiParam)({ name: 'ruleId', description: 'Rule ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'The rule.', type: automation_rule_dto_1.AutomationRuleResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'No such rule in this session.' }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('ruleId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AutomationRuleController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':ruleId'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Update an autoreply rule' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiParam)({ name: 'ruleId', description: 'Rule ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Updated rule.', type: automation_rule_dto_1.AutomationRuleResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid rule (bad conditions, over-limit text, out-of-range cooldown).' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'No such rule in this session.' }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('ruleId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, automation_rule_dto_1.UpdateAutomationRuleDto]),
    __metadata("design:returntype", Promise)
], AutomationRuleController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':ruleId'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete an autoreply rule' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiParam)({ name: 'ruleId', description: 'Rule ID' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Rule deleted.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'No such rule in this session.' }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('ruleId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AutomationRuleController.prototype, "remove", null);
exports.AutomationRuleController = AutomationRuleController = __decorate([
    (0, swagger_1.ApiTags)('automation'),
    (0, common_1.Controller)('sessions/:sessionId/automation-rules'),
    __metadata("design:paramtypes", [automation_rules_service_1.AutomationRulesService])
], AutomationRuleController);
//# sourceMappingURL=automation-rule.controller.js.map