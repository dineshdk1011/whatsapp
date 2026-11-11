"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutomationModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const automation_rule_entity_1 = require("./entities/automation-rule.entity");
const session_entity_1 = require("../session/entities/session.entity");
const automation_rules_service_1 = require("./automation-rules.service");
const automation_rule_controller_1 = require("./automation-rule.controller");
let AutomationModule = class AutomationModule {
};
exports.AutomationModule = AutomationModule;
exports.AutomationModule = AutomationModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([automation_rule_entity_1.AutomationRule, session_entity_1.Session], 'data')],
        controllers: [automation_rule_controller_1.AutomationRuleController],
        providers: [automation_rules_service_1.AutomationRulesService],
        exports: [automation_rules_service_1.AutomationRulesService],
    })
], AutomationModule);
//# sourceMappingURL=automation.module.js.map