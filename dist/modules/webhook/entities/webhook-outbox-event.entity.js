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
exports.WebhookOutboxEvent = void 0;
const typeorm_1 = require("typeorm");
const column_types_1 = require("../../../common/utils/column-types");
const date_transformer_1 = require("../../../common/transformers/date.transformer");
let WebhookOutboxEvent = class WebhookOutboxEvent {
    id;
    webhookId;
    sessionId;
    event;
    idempotencyKey;
    deliveryId;
    payload;
    state;
    attempts;
    lastAttemptAt;
    createdAt;
};
exports.WebhookOutboxEvent = WebhookOutboxEvent;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], WebhookOutboxEvent.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], WebhookOutboxEvent.prototype, "webhookId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], WebhookOutboxEvent.prototype, "sessionId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], WebhookOutboxEvent.prototype, "event", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], WebhookOutboxEvent.prototype, "idempotencyKey", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], WebhookOutboxEvent.prototype, "deliveryId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: (0, column_types_1.jsonColumnType)(), nullable: true }),
    __metadata("design:type", Object)
], WebhookOutboxEvent.prototype, "payload", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], WebhookOutboxEvent.prototype, "state", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], WebhookOutboxEvent.prototype, "attempts", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: (0, column_types_1.dateColumnType)(), nullable: true, transformer: date_transformer_1.DateTransformer }),
    __metadata("design:type", Object)
], WebhookOutboxEvent.prototype, "lastAttemptAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], WebhookOutboxEvent.prototype, "createdAt", void 0);
exports.WebhookOutboxEvent = WebhookOutboxEvent = __decorate([
    (0, typeorm_1.Entity)('webhook_outbox_events'),
    (0, typeorm_1.Index)('UQ_webhook_outbox_events_webhook_key', ['webhookId', 'idempotencyKey'], { unique: true }),
    (0, typeorm_1.Index)('IDX_webhook_outbox_events_state_createdAt', ['state', 'createdAt']),
    (0, typeorm_1.Index)('IDX_webhook_outbox_events_sessionId', ['sessionId'])
], WebhookOutboxEvent);
//# sourceMappingURL=webhook-outbox-event.entity.js.map