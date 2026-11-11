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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutomationRule = void 0;
const typeorm_1 = require("typeorm");
const session_entity_1 = require("../../session/entities/session.entity");
const column_types_1 = require("../../../common/utils/column-types");
let AutomationRule = class AutomationRule {
    id;
    sessionId;
    session;
    name;
    enabled;
    conditions;
    replyText;
    cooldownSeconds;
    createdAt;
    updatedAt;
};
exports.AutomationRule = AutomationRule;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AutomationRule.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)('IDX_automation_rules_sessionId'),
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], AutomationRule.prototype, "sessionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => session_entity_1.Session, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'sessionId' }),
    __metadata("design:type", session_entity_1.Session)
], AutomationRule.prototype, "session", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], AutomationRule.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], AutomationRule.prototype, "enabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: (0, column_types_1.jsonColumnType)(), nullable: true }),
    __metadata("design:type", Object)
], AutomationRule.prototype, "conditions", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], AutomationRule.prototype, "replyText", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 60 }),
    __metadata("design:type", Number)
], AutomationRule.prototype, "cooldownSeconds", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], AutomationRule.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], AutomationRule.prototype, "updatedAt", void 0);
exports.AutomationRule = AutomationRule = __decorate([
    (0, typeorm_1.Entity)('automation_rules')
], AutomationRule);
//# sourceMappingURL=automation-rule.entity.js.map