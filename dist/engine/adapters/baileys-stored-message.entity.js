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
exports.BaileysStoredMessage = void 0;
const typeorm_1 = require("typeorm");
const session_entity_1 = require("../../modules/session/entities/session.entity");
let BaileysStoredMessage = class BaileysStoredMessage {
    id;
    sessionId;
    session;
    waMessageId;
    serializedMessage;
    createdAt;
};
exports.BaileysStoredMessage = BaileysStoredMessage;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], BaileysStoredMessage.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], BaileysStoredMessage.prototype, "sessionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => session_entity_1.Session, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'sessionId' }),
    __metadata("design:type", session_entity_1.Session)
], BaileysStoredMessage.prototype, "session", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], BaileysStoredMessage.prototype, "waMessageId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], BaileysStoredMessage.prototype, "serializedMessage", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], BaileysStoredMessage.prototype, "createdAt", void 0);
exports.BaileysStoredMessage = BaileysStoredMessage = __decorate([
    (0, typeorm_1.Entity)('baileys_stored_messages'),
    (0, typeorm_1.Index)(['sessionId', 'waMessageId'], { unique: true }),
    (0, typeorm_1.Index)('IDX_baileys_stored_messages_session_created_id', ['sessionId', 'createdAt', 'id'])
], BaileysStoredMessage);
//# sourceMappingURL=baileys-stored-message.entity.js.map