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
exports.StatusUpdate = void 0;
const typeorm_1 = require("typeorm");
const message_entity_1 = require("../../message/entities/message.entity");
const nul_free_transformer_1 = require("../../../common/transformers/nul-free.transformer");
let StatusUpdate = class StatusUpdate {
    id;
    sessionId;
    contactJid;
    contactName;
    contactPushName;
    waStatusId;
    type;
    caption;
    mediaPath;
    mediaMimetype;
    mediaOmitted;
    omitReason;
    backgroundColor;
    font;
    postedAt;
    expiresAt;
};
exports.StatusUpdate = StatusUpdate;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], StatusUpdate.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], StatusUpdate.prototype, "sessionId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], StatusUpdate.prototype, "contactJid", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, transformer: nul_free_transformer_1.NulFreeTransformer }),
    __metadata("design:type", String)
], StatusUpdate.prototype, "contactName", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, transformer: nul_free_transformer_1.NulFreeTransformer }),
    __metadata("design:type", String)
], StatusUpdate.prototype, "contactPushName", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], StatusUpdate.prototype, "waStatusId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], StatusUpdate.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, transformer: nul_free_transformer_1.NulFreeTransformer }),
    __metadata("design:type", String)
], StatusUpdate.prototype, "caption", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], StatusUpdate.prototype, "mediaPath", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, transformer: nul_free_transformer_1.NulFreeTransformer }),
    __metadata("design:type", String)
], StatusUpdate.prototype, "mediaMimetype", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], StatusUpdate.prototype, "mediaOmitted", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], StatusUpdate.prototype, "omitReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], StatusUpdate.prototype, "backgroundColor", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], StatusUpdate.prototype, "font", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', transformer: message_entity_1.bigintToNumberTransformer }),
    __metadata("design:type", Number)
], StatusUpdate.prototype, "postedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', transformer: message_entity_1.bigintToNumberTransformer }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Number)
], StatusUpdate.prototype, "expiresAt", void 0);
exports.StatusUpdate = StatusUpdate = __decorate([
    (0, typeorm_1.Entity)('status_updates'),
    (0, typeorm_1.Index)(['sessionId', 'contactJid']),
    (0, typeorm_1.Index)(['sessionId', 'waStatusId'], { unique: true })
], StatusUpdate);
//# sourceMappingURL=status-update.entity.js.map