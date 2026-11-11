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
exports.IngressEvent = void 0;
const typeorm_1 = require("typeorm");
const column_types_1 = require("../../../common/utils/column-types");
const date_transformer_1 = require("../../../common/transformers/date.transformer");
let IngressEvent = class IngressEvent {
    id;
    instanceId;
    pluginId;
    providerDeliveryId;
    route;
    payload;
    payloadHash;
    sessionId;
    dispatchState;
    dispatchAttempts;
    lastDispatchAt;
    createdAt;
};
exports.IngressEvent = IngressEvent;
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", String)
], IngressEvent.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], IngressEvent.prototype, "instanceId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], IngressEvent.prototype, "pluginId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], IngressEvent.prototype, "providerDeliveryId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], IngressEvent.prototype, "route", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: (0, column_types_1.jsonColumnType)(), nullable: true }),
    __metadata("design:type", Object)
], IngressEvent.prototype, "payload", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], IngressEvent.prototype, "payloadHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], IngressEvent.prototype, "sessionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], IngressEvent.prototype, "dispatchState", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], IngressEvent.prototype, "dispatchAttempts", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: (0, column_types_1.dateColumnType)(), nullable: true, transformer: date_transformer_1.DateTransformer }),
    __metadata("design:type", Object)
], IngressEvent.prototype, "lastDispatchAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], IngressEvent.prototype, "createdAt", void 0);
exports.IngressEvent = IngressEvent = __decorate([
    (0, typeorm_1.Entity)('ingress_events'),
    (0, typeorm_1.Index)('UQ_ingress_events_instance_delivery', ['pluginId', 'instanceId', 'providerDeliveryId'], { unique: true }),
    (0, typeorm_1.Index)('IDX_ingress_events_createdAt', ['createdAt']),
    (0, typeorm_1.Index)('IDX_ingress_events_dispatchState', ['dispatchState', 'createdAt'])
], IngressEvent);
//# sourceMappingURL=ingress-event.entity.js.map