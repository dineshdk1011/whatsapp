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
exports.IntegrationDeliveryFailure = void 0;
const typeorm_1 = require("typeorm");
const column_types_1 = require("../../../common/utils/column-types");
const nul_free_transformer_1 = require("../../../common/transformers/nul-free.transformer");
let IntegrationDeliveryFailure = class IntegrationDeliveryFailure {
    id;
    direction;
    pluginId;
    instanceId;
    sessionId;
    deliveryId;
    attempts;
    lastError;
    payload;
    redriven;
    createdAt;
};
exports.IntegrationDeliveryFailure = IntegrationDeliveryFailure;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], IntegrationDeliveryFailure.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], IntegrationDeliveryFailure.prototype, "direction", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], IntegrationDeliveryFailure.prototype, "pluginId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], IntegrationDeliveryFailure.prototype, "instanceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], IntegrationDeliveryFailure.prototype, "sessionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], IntegrationDeliveryFailure.prototype, "deliveryId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], IntegrationDeliveryFailure.prototype, "attempts", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', transformer: nul_free_transformer_1.NulFreeTransformer }),
    __metadata("design:type", String)
], IntegrationDeliveryFailure.prototype, "lastError", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: (0, column_types_1.jsonColumnType)(), nullable: true }),
    __metadata("design:type", Object)
], IntegrationDeliveryFailure.prototype, "payload", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], IntegrationDeliveryFailure.prototype, "redriven", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], IntegrationDeliveryFailure.prototype, "createdAt", void 0);
exports.IntegrationDeliveryFailure = IntegrationDeliveryFailure = __decorate([
    (0, typeorm_1.Entity)('integration_delivery_failures'),
    (0, typeorm_1.Index)('IDX_integration_delivery_failures_instance', ['pluginId', 'instanceId']),
    (0, typeorm_1.Index)('IDX_integration_delivery_failures_instance_delivery', ['pluginId', 'instanceId', 'deliveryId'])
], IntegrationDeliveryFailure);
//# sourceMappingURL=integration-delivery-failure.entity.js.map