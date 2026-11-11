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
exports.WebhookDeliveryFailure = void 0;
const typeorm_1 = require("typeorm");
const nul_free_transformer_1 = require("../../../common/transformers/nul-free.transformer");
const column_types_1 = require("../../../common/utils/column-types");
let WebhookDeliveryFailure = class WebhookDeliveryFailure {
    id;
    webhookId;
    sessionId;
    event;
    url;
    idempotencyKey;
    deliveryId;
    attempts;
    lastStatusCode;
    lastError;
    payload;
    createdAt;
};
exports.WebhookDeliveryFailure = WebhookDeliveryFailure;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], WebhookDeliveryFailure.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], WebhookDeliveryFailure.prototype, "webhookId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], WebhookDeliveryFailure.prototype, "sessionId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], WebhookDeliveryFailure.prototype, "event", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], WebhookDeliveryFailure.prototype, "url", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], WebhookDeliveryFailure.prototype, "idempotencyKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], WebhookDeliveryFailure.prototype, "deliveryId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], WebhookDeliveryFailure.prototype, "attempts", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], WebhookDeliveryFailure.prototype, "lastStatusCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', transformer: nul_free_transformer_1.NulFreeTransformer }),
    __metadata("design:type", String)
], WebhookDeliveryFailure.prototype, "lastError", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: (0, column_types_1.jsonColumnType)(), nullable: true, select: false }),
    __metadata("design:type", Object)
], WebhookDeliveryFailure.prototype, "payload", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], WebhookDeliveryFailure.prototype, "createdAt", void 0);
exports.WebhookDeliveryFailure = WebhookDeliveryFailure = __decorate([
    (0, typeorm_1.Entity)('webhook_delivery_failures'),
    (0, typeorm_1.Index)('IDX_webhook_delivery_failures_sessionId', ['sessionId']),
    (0, typeorm_1.Index)('IDX_webhook_delivery_failures_delivery', ['webhookId', 'idempotencyKey']),
    (0, typeorm_1.Index)('UQ_webhook_delivery_failures_terminal', ['webhookId', 'idempotencyKey'], {
        unique: true,
        where: '"attempts" > 0',
    })
], WebhookDeliveryFailure);
//# sourceMappingURL=webhook-delivery-failure.entity.js.map