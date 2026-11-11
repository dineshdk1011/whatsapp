import { ModuleRef } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { LidMappingStoreService } from '../../engine/identity/lid-mapping-store.service';
import { AutomationRule } from './entities/automation-rule.entity';
import { Session } from '../session/entities/session.entity';
import { CreateAutomationRuleDto, UpdateAutomationRuleDto } from './dto/automation-rule.dto';
export declare class AutomationRulesService {
    private readonly ruleRepository;
    private readonly sessionRepository;
    private readonly moduleRef?;
    private readonly lidMappingStore?;
    private readonly configService?;
    private readonly logger;
    private readonly cooldowns;
    private nextCooldownSweepAt;
    private messagePort?;
    constructor(ruleRepository: Repository<AutomationRule>, sessionRepository: Repository<Session>, moduleRef?: ModuleRef | undefined, lidMappingStore?: LidMappingStoreService | undefined, configService?: ConfigService | undefined);
    create(sessionId: string, dto: CreateAutomationRuleDto): Promise<AutomationRule>;
    findAll(sessionId: string): Promise<AutomationRule[]>;
    findOne(sessionId: string, id: string): Promise<AutomationRule>;
    update(sessionId: string, id: string, dto: UpdateAutomationRuleDto): Promise<AutomationRule>;
    remove(sessionId: string, id: string): Promise<void>;
    evaluateInbound(sessionId: string, message: Record<string, unknown>): Promise<void>;
    private resolveMessagePort;
    private inCooldown;
    private enterCooldown;
}
