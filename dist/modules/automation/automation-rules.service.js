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
exports.AutomationRulesService = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const logger_service_1 = require("../../common/services/logger.service");
const lid_mapping_store_service_1 = require("../../engine/identity/lid-mapping-store.service");
const wa_id_1 = require("../../engine/identity/wa-id");
const filter_evaluator_1 = require("../webhook/filters/filter-evaluator");
const plugin_host_ports_1 = require("../../core/plugins/plugin-host-ports");
const automation_rule_entity_1 = require("./entities/automation-rule.entity");
const session_entity_1 = require("../session/entities/session.entity");
const automation_rule_dto_1 = require("./dto/automation-rule.dto");
const COOLDOWN_SWEEP_THRESHOLD = 10_000;
const MAX_MESSAGE_AGE_SECONDS = 300;
const OPT_IN_CHAT_KINDS = new Set(['channel', 'broadcast', 'status']);
let AutomationRulesService = class AutomationRulesService {
    ruleRepository;
    sessionRepository;
    moduleRef;
    lidMappingStore;
    configService;
    logger = (0, logger_service_1.createLogger)('AutomationRulesService');
    cooldowns = new Map();
    nextCooldownSweepAt = COOLDOWN_SWEEP_THRESHOLD;
    messagePort;
    constructor(ruleRepository, sessionRepository, moduleRef, lidMappingStore, configService) {
        this.ruleRepository = ruleRepository;
        this.sessionRepository = sessionRepository;
        this.moduleRef = moduleRef;
        this.lidMappingStore = lidMappingStore;
        this.configService = configService;
    }
    async create(sessionId, dto) {
        if (!(await this.sessionRepository.exists({ where: { id: sessionId } }))) {
            throw new common_1.NotFoundException(`Session with id '${sessionId}' not found`);
        }
        const maxPerSession = this.configService?.get('automation.maxPerSession', 32) ?? 32;
        if (maxPerSession > 0) {
            const existing = await this.ruleRepository.count({ where: { sessionId } });
            if (existing >= maxPerSession) {
                throw new common_1.BadRequestException(`Automation rule limit reached for this session (${existing}/${maxPerSession}); delete one before adding another`);
            }
        }
        const rule = this.ruleRepository.create({
            sessionId,
            name: dto.name,
            replyText: dto.replyText,
            conditions: dto.conditions ?? null,
            cooldownSeconds: dto.cooldownSeconds ?? 60,
            enabled: dto.enabled ?? true,
        });
        return this.ruleRepository.save(rule, { transaction: false });
    }
    async findAll(sessionId) {
        return this.ruleRepository.find({ where: { sessionId }, order: { createdAt: 'ASC', id: 'ASC' } });
    }
    async findOne(sessionId, id) {
        const rule = await this.ruleRepository.findOne({ where: { id, sessionId } });
        if (!rule) {
            throw new common_1.NotFoundException(`Automation rule ${id} not found`);
        }
        return rule;
    }
    async update(sessionId, id, dto) {
        const rule = await this.findOne(sessionId, id);
        const patch = {};
        if (dto.name !== undefined)
            patch.name = dto.name;
        if (dto.replyText !== undefined)
            patch.replyText = dto.replyText;
        if (dto.conditions !== undefined)
            patch.conditions = dto.conditions;
        if (dto.cooldownSeconds !== undefined)
            patch.cooldownSeconds = dto.cooldownSeconds;
        if (dto.enabled !== undefined)
            patch.enabled = dto.enabled;
        if (Object.keys(patch).length === 0)
            return rule;
        const result = await this.ruleRepository.update({ id, sessionId }, patch);
        if (!result.affected)
            throw new common_1.NotFoundException(`Automation rule ${id} not found`);
        return this.findOne(sessionId, id);
    }
    async remove(sessionId, id) {
        const rule = await this.findOne(sessionId, id);
        await this.ruleRepository.remove(rule);
    }
    async evaluateInbound(sessionId, message) {
        if (message.fromMe === true)
            return;
        const chatId = typeof message.chatId === 'string' ? message.chatId : null;
        if (!chatId)
            return;
        const timestamp = typeof message.timestamp === 'number' ? message.timestamp : null;
        if (timestamp !== null && Date.now() / 1000 - timestamp > MAX_MESSAGE_AGE_SECONDS)
            return;
        let rules;
        try {
            rules = await this.ruleRepository.find({
                where: { sessionId, enabled: true },
                order: { createdAt: 'ASC', id: 'ASC' },
            });
        }
        catch (error) {
            this.logger.warn('Automation rule lookup failed', {
                sessionId,
                error: error instanceof Error ? error.message : String(error),
            });
            return;
        }
        if (rules.length === 0)
            return;
        const resolveLid = await (0, filter_evaluator_1.prepareFilterLidResolver)(rules.map(rule => rule.conditions), 'message.received', message, this.lidMappingStore ? lids => this.lidMappingStore.phonesForLidsPersisted(lids) : undefined);
        const kind = typeof message.kind === 'string' && message.kind ? message.kind : (0, wa_id_1.chatKind)(chatId);
        const optInOnly = OPT_IN_CHAT_KINDS.has(kind);
        const rule = rules.find(candidate => {
            try {
                const conditions = candidate.conditions;
                if (conditions != null &&
                    (typeof conditions !== 'object' ||
                        Array.isArray(conditions) ||
                        (candidate.conditions?.conditions != null && !Array.isArray(candidate.conditions.conditions)))) {
                    throw new TypeError('conditions must be an object with a conditions array');
                }
                return ((!optInOnly || candidate.conditions?.conditions?.some(c => c.field === 'kind')) &&
                    (0, filter_evaluator_1.evaluateFilters)(candidate.conditions, 'message.received', message, resolveLid));
            }
            catch (error) {
                this.logger.warn('Skipping automation rule with malformed conditions', {
                    sessionId,
                    ruleId: candidate.id,
                    error: error instanceof Error ? error.message : String(error),
                });
                return false;
            }
        });
        if (!rule)
            return;
        if (this.inCooldown(rule, chatId))
            return;
        this.enterCooldown(rule, chatId);
        try {
            const messagePort = this.resolveMessagePort();
            if (!messagePort)
                return;
            await messagePort.sendText(sessionId, { chatId, text: rule.replyText });
            this.logger.debug('Automation rule replied', { sessionId, ruleId: rule.id, chatId });
        }
        catch (error) {
            this.logger.warn('Automation rule reply failed', {
                sessionId,
                ruleId: rule.id,
                chatId,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    resolveMessagePort() {
        if (!this.messagePort) {
            try {
                this.messagePort = this.moduleRef?.get(plugin_host_ports_1.PLUGIN_MESSAGE_PORT, {
                    strict: false,
                });
            }
            catch (error) {
                this.logger.warn('MessageService is not resolvable; automation replies are disabled', {
                    error: error instanceof Error ? error.message : String(error),
                });
                return undefined;
            }
        }
        return this.messagePort;
    }
    inCooldown(rule, chatId) {
        if (!rule.cooldownSeconds)
            return false;
        const firedAt = this.cooldowns.get(`${rule.id}:${chatId}`);
        return firedAt !== undefined && firedAt + rule.cooldownSeconds * 1000 > Date.now();
    }
    enterCooldown(rule, chatId) {
        if (!rule.cooldownSeconds)
            return;
        const now = Date.now();
        if (this.cooldowns.size >= this.nextCooldownSweepAt) {
            for (const [key, firedAt] of this.cooldowns) {
                if (firedAt + automation_rule_dto_1.AUTOMATION_COOLDOWN_MAX_SECONDS * 1000 <= now)
                    this.cooldowns.delete(key);
            }
            this.nextCooldownSweepAt = Math.max(COOLDOWN_SWEEP_THRESHOLD, this.cooldowns.size * 2);
        }
        this.cooldowns.set(`${rule.id}:${chatId}`, now);
    }
};
exports.AutomationRulesService = AutomationRulesService;
exports.AutomationRulesService = AutomationRulesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(automation_rule_entity_1.AutomationRule, 'data')),
    __param(1, (0, typeorm_1.InjectRepository)(session_entity_1.Session, 'data')),
    __param(2, (0, common_1.Optional)()),
    __param(3, (0, common_1.Optional)()),
    __param(4, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        core_1.ModuleRef,
        lid_mapping_store_service_1.LidMappingStoreService,
        config_1.ConfigService])
], AutomationRulesService);
//# sourceMappingURL=automation-rules.service.js.map