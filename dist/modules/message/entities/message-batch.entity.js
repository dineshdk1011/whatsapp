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
exports.MessageBatch = exports.BatchMessageStatus = exports.BatchStatus = void 0;
const typeorm_1 = require("typeorm");
const date_transformer_1 = require("../../../common/transformers/date.transformer");
const column_types_1 = require("../../../common/utils/column-types");
var BatchStatus;
(function (BatchStatus) {
    BatchStatus["PENDING"] = "pending";
    BatchStatus["PROCESSING"] = "processing";
    BatchStatus["COMPLETED"] = "completed";
    BatchStatus["CANCELLED"] = "cancelled";
    BatchStatus["FAILED"] = "failed";
})(BatchStatus || (exports.BatchStatus = BatchStatus = {}));
var BatchMessageStatus;
(function (BatchMessageStatus) {
    BatchMessageStatus["PENDING"] = "pending";
    BatchMessageStatus["SENT"] = "sent";
    BatchMessageStatus["FAILED"] = "failed";
    BatchMessageStatus["CANCELLED"] = "cancelled";
})(BatchMessageStatus || (exports.BatchMessageStatus = BatchMessageStatus = {}));
let MessageBatch = class MessageBatch {
    id;
    batchId;
    sessionId;
    status;
    messages;
    options;
    progress;
    results;
    currentIndex;
    createdAt;
    updatedAt;
    startedAt;
    completedAt;
};
exports.MessageBatch = MessageBatch;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], MessageBatch.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'batch_id' }),
    __metadata("design:type", String)
], MessageBatch.prototype, "batchId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'session_id' }),
    __metadata("design:type", String)
], MessageBatch.prototype, "sessionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', default: BatchStatus.PENDING }),
    __metadata("design:type", String)
], MessageBatch.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: (0, column_types_1.jsonColumnType)() }),
    __metadata("design:type", Array)
], MessageBatch.prototype, "messages", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: (0, column_types_1.jsonColumnType)(), nullable: true }),
    __metadata("design:type", Object)
], MessageBatch.prototype, "options", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: (0, column_types_1.jsonColumnType)(), nullable: true }),
    __metadata("design:type", Object)
], MessageBatch.prototype, "progress", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: (0, column_types_1.jsonColumnType)(), nullable: true }),
    __metadata("design:type", Array)
], MessageBatch.prototype, "results", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'current_index', default: 0 }),
    __metadata("design:type", Number)
], MessageBatch.prototype, "currentIndex", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], MessageBatch.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], MessageBatch.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'started_at', type: (0, column_types_1.dateColumnType)(), nullable: true, transformer: date_transformer_1.DateTransformer }),
    __metadata("design:type", Object)
], MessageBatch.prototype, "startedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'completed_at', type: (0, column_types_1.dateColumnType)(), nullable: true, transformer: date_transformer_1.DateTransformer }),
    __metadata("design:type", Object)
], MessageBatch.prototype, "completedAt", void 0);
exports.MessageBatch = MessageBatch = __decorate([
    (0, typeorm_1.Entity)('message_batches'),
    (0, typeorm_1.Unique)('UQ_message_batches_session_id_batch_id', ['sessionId', 'batchId'])
], MessageBatch);
//# sourceMappingURL=message-batch.entity.js.map