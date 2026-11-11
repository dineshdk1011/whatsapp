import { WebhookFilters } from '../../webhook/filters/filter-types';
import { AutomationRule } from '../entities/automation-rule.entity';
export declare const AUTOMATION_COOLDOWN_MAX_SECONDS = 86400;
export declare class CreateAutomationRuleDto {
    name: string;
    replyText: string;
    conditions?: WebhookFilters | null;
    cooldownSeconds?: number;
    enabled?: boolean;
}
export declare class UpdateAutomationRuleDto {
    name?: string;
    replyText?: string;
    conditions?: WebhookFilters | null;
    cooldownSeconds?: number;
    enabled?: boolean;
}
export declare class AutomationRuleResponseDto {
    id: string;
    sessionId: string;
    name: string;
    enabled: boolean;
    conditions: WebhookFilters | null;
    replyText: string;
    cooldownSeconds: number;
    createdAt: Date;
    updatedAt: Date;
    static fromEntity(rule: AutomationRule): AutomationRuleResponseDto;
}
