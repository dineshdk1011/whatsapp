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
exports.ConversationMapping = void 0;
const typeorm_1 = require("typeorm");
const column_types_1 = require("../../../common/utils/column-types");
let ConversationMapping = class ConversationMapping {
    id;
    sessionId;
    chatId;
    pluginId;
    instanceId;
    providerConversationId;
    handoverState;
    metadata;
    updatedAt;
};
exports.ConversationMapping = ConversationMapping;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ConversationMapping.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ConversationMapping.prototype, "sessionId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ConversationMapping.prototype, "chatId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ConversationMapping.prototype, "pluginId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ConversationMapping.prototype, "instanceId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ConversationMapping.prototype, "providerConversationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'bot' }),
    __metadata("design:type", String)
], ConversationMapping.prototype, "handoverState", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: (0, column_types_1.jsonColumnType)(), nullable: true }),
    __metadata("design:type", Object)
], ConversationMapping.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], ConversationMapping.prototype, "updatedAt", void 0);
exports.ConversationMapping = ConversationMapping = __decorate([
    (0, typeorm_1.Entity)('conversation_mappings'),
    (0, typeorm_1.Index)('UQ_conversation_mappings_forward', ['sessionId', 'chatId', 'pluginId', 'instanceId'], { unique: true }),
    (0, typeorm_1.Index)('UQ_conversation_mappings_reverse', ['pluginId', 'instanceId', 'providerConversationId'], { unique: true })
], ConversationMapping);
//# sourceMappingURL=conversation-mapping.entity.js.map