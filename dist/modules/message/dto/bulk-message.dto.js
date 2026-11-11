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
exports.BatchCancelResponseDto = exports.BatchStatusResponseDto = exports.BatchMessageResultDto = exports.BatchMessageErrorDto = exports.BatchProgressDto = exports.BulkMessageResponseDto = exports.SendBulkMessageDto = exports.BULK_MESSAGES_MAX = exports.BulkMessageContentDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const class_validator_2 = require("class-validator");
const strict_boolean_1 = require("../../../common/utils/strict-boolean");
const send_message_dto_1 = require("./send-message.dto");
const is_mention_wid_validator_1 = require("./is-mention-wid.validator");
const message_batch_entity_1 = require("../entities/message-batch.entity");
const template_render_1 = require("../../../common/utils/template-render");
let IsBulkMentionWidConstraint = class IsBulkMentionWidConstraint {
    validate(value) {
        return typeof value === 'string' && ((0, is_mention_wid_validator_1.isMentionWid)(value) || (0, template_render_1.templateVariableNames)(value).length > 0);
    }
    defaultMessage() {
        return 'each mentions entry must be an individual WID or contain a template placeholder';
    }
};
IsBulkMentionWidConstraint = __decorate([
    (0, class_validator_1.ValidatorConstraint)({ name: 'isBulkMentionWid', async: false })
], IsBulkMentionWidConstraint);
class BulkMediaDto {
    url;
    base64;
    mimetype;
    filename;
    ptt;
}
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Media URL (http/https)' }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BulkMediaDto.prototype, "url", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Base64-encoded media data' }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BulkMediaDto.prototype, "base64", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Media MIME type' }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BulkMediaDto.prototype, "mimetype", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filename (documents only)' }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BulkMediaDto.prototype, "filename", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Audio only: send as a WhatsApp voice note (PTT)' }),
    (0, strict_boolean_1.ToStrictBoolean)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], BulkMediaDto.prototype, "ptt", void 0);
class BulkMessageContentDto {
    text;
    image;
    video;
    audio;
    document;
    caption;
    mentions;
}
exports.BulkMessageContentDto = BulkMessageContentDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Text content for text messages', maxLength: send_message_dto_1.MESSAGE_TEXT_MAX_LENGTH }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(send_message_dto_1.MESSAGE_TEXT_MAX_LENGTH),
    __metadata("design:type", String)
], BulkMessageContentDto.prototype, "text", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Image URL or base64', type: BulkMediaDto }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => BulkMediaDto),
    __metadata("design:type", BulkMediaDto)
], BulkMessageContentDto.prototype, "image", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Video URL or base64', type: BulkMediaDto }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => BulkMediaDto),
    __metadata("design:type", BulkMediaDto)
], BulkMessageContentDto.prototype, "video", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Audio URL or base64', type: BulkMediaDto }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => BulkMediaDto),
    __metadata("design:type", BulkMediaDto)
], BulkMessageContentDto.prototype, "audio", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Document URL or base64', type: BulkMediaDto }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => BulkMediaDto),
    __metadata("design:type", BulkMediaDto)
], BulkMessageContentDto.prototype, "document", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Caption for media messages', maxLength: 1024 }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1024),
    __metadata("design:type", String)
], BulkMessageContentDto.prototype, "caption", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: send_message_dto_1.MENTIONS_DESCRIPTION,
        example: ['628123456789@c.us'],
        type: [String],
        maxItems: send_message_dto_1.MENTIONS_MAX,
        items: { type: 'string', maxLength: send_message_dto_1.MENTION_WID_MAX_LENGTH },
    }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictArray)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(send_message_dto_1.MENTIONS_MAX),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.MaxLength)(send_message_dto_1.MENTION_WID_MAX_LENGTH, { each: true }),
    (0, class_validator_2.Validate)(IsBulkMentionWidConstraint, { each: true }),
    __metadata("design:type", Array)
], BulkMessageContentDto.prototype, "mentions", void 0);
class BulkMessageItemDto {
    chatId;
    type;
    content;
    variables;
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Recipient chat ID', example: '628123456789@c.us', maxLength: send_message_dto_1.CHAT_ID_MAX_LENGTH }),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(send_message_dto_1.CHAT_ID_MAX_LENGTH),
    (0, class_validator_1.Matches)(send_message_dto_1.CHAT_JID_PATTERN, { message: send_message_dto_1.CHAT_JID_MESSAGE }),
    __metadata("design:type", String)
], BulkMessageItemDto.prototype, "chatId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Message type', enum: ['text', 'image', 'video', 'audio', 'document'] }),
    (0, class_validator_1.IsIn)(['text', 'image', 'video', 'audio', 'document']),
    __metadata("design:type", String)
], BulkMessageItemDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Message content based on type' }),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => BulkMessageContentDto),
    __metadata("design:type", BulkMessageContentDto)
], BulkMessageItemDto.prototype, "content", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Variables for template substitution' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], BulkMessageItemDto.prototype, "variables", void 0);
class BulkMessageOptionsDto {
    delayBetweenMessages;
    randomizeDelay;
    stopOnError;
}
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Delay between messages in ms.',
        default: 3000,
        minimum: 1000,
        maximum: 60000,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1000),
    (0, class_validator_1.Max)(60000),
    __metadata("design:type", Number)
], BulkMessageOptionsDto.prototype, "delayBetweenMessages", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Add random 0-2s to delay', default: true }),
    (0, strict_boolean_1.ToStrictBoolean)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], BulkMessageOptionsDto.prototype, "randomizeDelay", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Stop batch on first error', default: false }),
    (0, strict_boolean_1.ToStrictBoolean)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], BulkMessageOptionsDto.prototype, "stopOnError", void 0);
exports.BULK_MESSAGES_MAX = 100;
class SendBulkMessageDto {
    batchId;
    messages;
    options;
}
exports.SendBulkMessageDto = SendBulkMessageDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Custom batch ID (auto-generated if not provided)',
        maxLength: send_message_dto_1.BATCH_ID_MAX_LENGTH,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(send_message_dto_1.BATCH_ID_MAX_LENGTH),
    __metadata("design:type", String)
], SendBulkMessageDto.prototype, "batchId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Array of messages (max 100 per request; exact duplicate entries are collapsed — first occurrence wins)',
        type: [BulkMessageItemDto],
        maxItems: exports.BULK_MESSAGES_MAX,
    }),
    (0, strict_boolean_1.ToStrictArray)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(exports.BULK_MESSAGES_MAX),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => BulkMessageItemDto),
    __metadata("design:type", Array)
], SendBulkMessageDto.prototype, "messages", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Batch processing options' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => BulkMessageOptionsDto),
    __metadata("design:type", BulkMessageOptionsDto)
], SendBulkMessageDto.prototype, "options", void 0);
class BulkMessageResponseDto {
    batchId;
    status;
    totalMessages;
    estimatedCompletionTime;
    statusUrl;
}
exports.BulkMessageResponseDto = BulkMessageResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BulkMessageResponseDto.prototype, "batchId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BulkMessageResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], BulkMessageResponseDto.prototype, "totalMessages", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], BulkMessageResponseDto.prototype, "estimatedCompletionTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BulkMessageResponseDto.prototype, "statusUrl", void 0);
class BatchProgressDto {
    total;
    sent;
    failed;
    pending;
    cancelled;
}
exports.BatchProgressDto = BatchProgressDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 10 }),
    __metadata("design:type", Number)
], BatchProgressDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 7 }),
    __metadata("design:type", Number)
], BatchProgressDto.prototype, "sent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    __metadata("design:type", Number)
], BatchProgressDto.prototype, "failed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 2 }),
    __metadata("design:type", Number)
], BatchProgressDto.prototype, "pending", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0 }),
    __metadata("design:type", Number)
], BatchProgressDto.prototype, "cancelled", void 0);
class BatchMessageErrorDto {
    code;
    message;
}
exports.BatchMessageErrorDto = BatchMessageErrorDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Machine-readable failure code.', example: 'RECIPIENT_UNREACHABLE' }),
    __metadata("design:type", String)
], BatchMessageErrorDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'The number is not registered on WhatsApp' }),
    __metadata("design:type", String)
], BatchMessageErrorDto.prototype, "message", void 0);
class BatchMessageResultDto {
    chatId;
    status;
    messageId;
    error;
    sentAt;
}
exports.BatchMessageResultDto = BatchMessageResultDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '628123456789@c.us' }),
    __metadata("design:type", String)
], BatchMessageResultDto.prototype, "chatId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: message_batch_entity_1.BatchMessageStatus, example: message_batch_entity_1.BatchMessageStatus.SENT }),
    __metadata("design:type", String)
], BatchMessageResultDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Assigned on a successful send.',
        example: 'true_628123456789@c.us_3EB0123456789',
    }),
    __metadata("design:type", String)
], BatchMessageResultDto.prototype, "messageId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: BatchMessageErrorDto, description: 'Present on a failed send.' }),
    __metadata("design:type", BatchMessageErrorDto)
], BatchMessageResultDto.prototype, "error", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: String, format: 'date-time', description: 'When the send completed.' }),
    __metadata("design:type", Date)
], BatchMessageResultDto.prototype, "sentAt", void 0);
class BatchStatusResponseDto {
    batchId;
    status;
    progress;
    results;
    startedAt;
    completedAt;
}
exports.BatchStatusResponseDto = BatchStatusResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'batch_abc123' }),
    __metadata("design:type", String)
], BatchStatusResponseDto.prototype, "batchId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: message_batch_entity_1.BatchStatus, example: message_batch_entity_1.BatchStatus.PROCESSING }),
    __metadata("design:type", String)
], BatchStatusResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: BatchProgressDto }),
    __metadata("design:type", BatchProgressDto)
], BatchStatusResponseDto.prototype, "progress", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [BatchMessageResultDto], description: 'One entry per recipient already attempted.' }),
    __metadata("design:type", Array)
], BatchStatusResponseDto.prototype, "results", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: String,
        format: 'date-time',
        nullable: true,
        description: 'When processing started; null while the batch is pending.',
    }),
    __metadata("design:type", Object)
], BatchStatusResponseDto.prototype, "startedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: String,
        format: 'date-time',
        nullable: true,
        description: 'When the batch reached a terminal status; null while it is still running.',
    }),
    __metadata("design:type", Object)
], BatchStatusResponseDto.prototype, "completedAt", void 0);
class BatchCancelResponseDto {
    batchId;
    status;
    progress;
}
exports.BatchCancelResponseDto = BatchCancelResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'batch_abc123' }),
    __metadata("design:type", String)
], BatchCancelResponseDto.prototype, "batchId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: message_batch_entity_1.BatchStatus, example: message_batch_entity_1.BatchStatus.CANCELLED }),
    __metadata("design:type", String)
], BatchCancelResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: BatchProgressDto }),
    __metadata("design:type", BatchProgressDto)
], BatchCancelResponseDto.prototype, "progress", void 0);
//# sourceMappingURL=bulk-message.dto.js.map