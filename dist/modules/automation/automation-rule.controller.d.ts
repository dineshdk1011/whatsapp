import { AutomationRulesService } from './automation-rules.service';
import { AutomationRuleResponseDto, CreateAutomationRuleDto, UpdateAutomationRuleDto } from './dto/automation-rule.dto';
export declare class AutomationRuleController {
    private readonly automationRules;
    constructor(automationRules: AutomationRulesService);
    create(sessionId: string, dto: CreateAutomationRuleDto): Promise<AutomationRuleResponseDto>;
    findAll(sessionId: string): Promise<AutomationRuleResponseDto[]>;
    findOne(sessionId: string, ruleId: string): Promise<AutomationRuleResponseDto>;
    update(sessionId: string, ruleId: string, dto: UpdateAutomationRuleDto): Promise<AutomationRuleResponseDto>;
    remove(sessionId: string, ruleId: string): Promise<void>;
}
