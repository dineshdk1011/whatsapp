"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.automationTools = automationTools;
const zod_1 = require("zod");
const api_key_entity_1 = require("../../../modules/auth/entities/api-key.entity");
const automation_rule_dto_1 = require("../../../modules/automation/dto/automation-rule.dto");
const tool_descriptor_1 = require("../tool-descriptor");
const sessionId = zod_1.z.string().min(1).describe('Session UUID (the session id, not the name)');
function automationTools(automation) {
    return [
        (0, tool_descriptor_1.defineTool)({
            name: 'AutomationRuleFindAll',
            description: 'List a session’s autoreply rules in evaluation order (creation time, id as tiebreak).',
            tier: 'read',
            requiredRole: api_key_entity_1.ApiKeyRole.OPERATOR,
            sessionScoped: true,
            inputSchema: zod_1.z.object({ sessionId }),
            handler: input => automation
                .findAll(input.sessionId)
                .then(rules => rules.map(rule => automation_rule_dto_1.AutomationRuleResponseDto.fromEntity(rule))),
        }),
        (0, tool_descriptor_1.defineTool)({
            name: 'AutomationRuleFindOne',
            description: 'Get one autoreply rule by ID within a session.',
            tier: 'read',
            requiredRole: api_key_entity_1.ApiKeyRole.OPERATOR,
            sessionScoped: true,
            inputSchema: zod_1.z.object({
                sessionId,
                ruleId: zod_1.z.string().min(1).describe('Rule UUID'),
            }),
            handler: input => automation.findOne(input.sessionId, input.ruleId).then(rule => automation_rule_dto_1.AutomationRuleResponseDto.fromEntity(rule)),
        }),
    ];
}
//# sourceMappingURL=automation.tools.js.map