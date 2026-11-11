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
exports.ChatState = void 0;
const typeorm_1 = require("typeorm");
let ChatState = class ChatState {
    sessionId;
    chatId;
    muteEndTime;
    archived;
    pinned;
    observed;
    deletedAt;
    updatedAt;
};
exports.ChatState = ChatState;
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", String)
], ChatState.prototype, "sessionId", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", String)
], ChatState.prototype, "chatId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'bigint',
        nullable: true,
        transformer: { to: (v) => v, from: (v) => (v == null ? null : Number(v)) },
    }),
    __metadata("design:type", Object)
], ChatState.prototype, "muteEndTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], ChatState.prototype, "archived", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], ChatState.prototype, "pinned", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], ChatState.prototype, "observed", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'bigint',
        nullable: true,
        transformer: { to: (v) => v, from: (v) => (v == null ? null : Number(v)) },
    }),
    __metadata("design:type", Object)
], ChatState.prototype, "deletedAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], ChatState.prototype, "updatedAt", void 0);
exports.ChatState = ChatState = __decorate([
    (0, typeorm_1.Entity)('chat_states')
], ChatState);
//# sourceMappingURL=baileys-chat-state.entity.js.map