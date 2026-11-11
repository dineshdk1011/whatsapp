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
exports.SendIdempotencyKey = void 0;
const typeorm_1 = require("typeorm");
const column_types_1 = require("../../../common/utils/column-types");
const date_transformer_1 = require("../../../common/transformers/date.transformer");
let SendIdempotencyKey = class SendIdempotencyKey {
    id;
    sessionId;
    idempotencyKey;
    route;
    requestHash;
    state;
    responseBody;
    expiresAt;
    createdAt;
};
exports.SendIdempotencyKey = SendIdempotencyKey;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SendIdempotencyKey.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SendIdempotencyKey.prototype, "sessionId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SendIdempotencyKey.prototype, "idempotencyKey", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SendIdempotencyKey.prototype, "route", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SendIdempotencyKey.prototype, "requestHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], SendIdempotencyKey.prototype, "state", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: (0, column_types_1.jsonColumnType)(), nullable: true }),
    __metadata("design:type", Object)
], SendIdempotencyKey.prototype, "responseBody", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: (0, column_types_1.dateColumnType)(), transformer: date_transformer_1.DateTransformer }),
    __metadata("design:type", Date)
], SendIdempotencyKey.prototype, "expiresAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], SendIdempotencyKey.prototype, "createdAt", void 0);
exports.SendIdempotencyKey = SendIdempotencyKey = __decorate([
    (0, typeorm_1.Entity)('send_idempotency_keys'),
    (0, typeorm_1.Index)('UQ_send_idempotency_keys_session_key', ['sessionId', 'idempotencyKey'], { unique: true }),
    (0, typeorm_1.Index)('IDX_send_idempotency_keys_expiresAt', ['expiresAt'])
], SendIdempotencyKey);
//# sourceMappingURL=send-idempotency-key.entity.js.map