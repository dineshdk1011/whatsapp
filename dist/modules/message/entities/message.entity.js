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
exports.Message = exports.MessageStatus = exports.MessageDirection = exports.bigintToNumberTransformer = void 0;
const typeorm_1 = require("typeorm");
const column_types_1 = require("../../../common/utils/column-types");
const nul_free_transformer_1 = require("../../../common/transformers/nul-free.transformer");
exports.bigintToNumberTransformer = {
    to: (value) => value,
    from: (value) => {
        if (value == null)
            return null;
        const n = Number(value);
        return Number.isNaN(n) ? null : n;
    },
};
var MessageDirection;
(function (MessageDirection) {
    MessageDirection["INCOMING"] = "incoming";
    MessageDirection["OUTGOING"] = "outgoing";
})(MessageDirection || (exports.MessageDirection = MessageDirection = {}));
var MessageStatus;
(function (MessageStatus) {
    MessageStatus["PENDING"] = "pending";
    MessageStatus["SENT"] = "sent";
    MessageStatus["DELIVERED"] = "delivered";
    MessageStatus["READ"] = "read";
    MessageStatus["FAILED"] = "failed";
})(MessageStatus || (exports.MessageStatus = MessageStatus = {}));
let Message = class Message {
    id;
    sessionId;
    waMessageId;
    chatId;
    chatName;
    author;
    from;
    to;
    body;
    type;
    direction;
    timestamp;
    metadata;
    mediaPath;
    mediaMimetype;
    status;
    createdAt;
};
exports.Message = Message;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Message.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Message.prototype, "sessionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Message.prototype, "waMessageId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Message.prototype, "chatId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, transformer: nul_free_transformer_1.NulFreeTransformer }),
    __metadata("design:type", String)
], Message.prototype, "chatName", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Message.prototype, "author", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Message.prototype, "from", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Message.prototype, "to", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, transformer: nul_free_transformer_1.NulFreeTransformer }),
    __metadata("design:type", String)
], Message.prototype, "body", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'text' }),
    __metadata("design:type", String)
], Message.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        default: MessageDirection.OUTGOING,
    }),
    __metadata("design:type", String)
], Message.prototype, "direction", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', nullable: true, transformer: exports.bigintToNumberTransformer }),
    __metadata("design:type", Number)
], Message.prototype, "timestamp", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: (0, column_types_1.jsonColumnType)(), nullable: true }),
    __metadata("design:type", Object)
], Message.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Index)('IDX_messages_mediaPath', { where: '"mediaPath" IS NOT NULL' }),
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Message.prototype, "mediaPath", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, transformer: nul_free_transformer_1.NulFreeTransformer }),
    __metadata("design:type", String)
], Message.prototype, "mediaMimetype", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        default: MessageStatus.SENT,
    }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Message.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    (0, typeorm_1.Index)('IDX_messages_createdAt'),
    __metadata("design:type", Date)
], Message.prototype, "createdAt", void 0);
exports.Message = Message = __decorate([
    (0, typeorm_1.Entity)('messages'),
    (0, typeorm_1.Index)(['sessionId', 'createdAt']),
    (0, typeorm_1.Index)(['chatId']),
    (0, typeorm_1.Index)('IDX_messages_sessionId_chatId_createdAt', ['sessionId', 'chatId', 'createdAt']),
    (0, typeorm_1.Index)('IDX_messages_session_timestamp_id', ['sessionId', 'timestamp', 'id']),
    (0, typeorm_1.Index)('IDX_messages_session_chat_timestamp_id', ['sessionId', 'chatId', 'timestamp', 'id']),
    (0, typeorm_1.Index)('IDX_messages_session_direction_timestamp_id', ['sessionId', 'direction', 'timestamp', 'id']),
    (0, typeorm_1.Index)('UQ_messages_sessionId_waMessageId', ['sessionId', 'waMessageId'], { unique: true })
], Message);
//# sourceMappingURL=message.entity.js.map