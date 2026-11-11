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
exports.WebhookTestResponseDto = exports.WebhookRedriveResultDto = exports.RedriveWebhookDeliveriesDto = exports.WebhookDeliveryFailureDto = exports.WebhookResponseDto = exports.UpdateWebhookDto = exports.CreateWebhookDto = exports.WEBHOOK_EVENTS = exports.WEBHOOK_RESERVED_EVENTS = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const filter_types_1 = require("../filters/filter-types");
const filter_validation_1 = require("../filters/filter-validation");
const is_header_map_validator_1 = require("./is-header-map.validator");
const strict_boolean_1 = require("../../../common/utils/strict-boolean");
const max_code_points_1 = require("../../../common/validation/max-code-points");
class WebhookFilterConditionDto {
    field;
    operator;
    value;
    caseSensitive;
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'sender', description: 'Filterable field for the fired event family.' }),
    __metadata("design:type", String)
], WebhookFilterConditionDto.prototype, "field", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['is', 'isNot', 'contains', 'equals'], example: 'is' }),
    __metadata("design:type", String)
], WebhookFilterConditionDto.prototype, "operator", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }, { type: 'boolean' }],
        example: ['1234567890@c.us'],
    }),
    __metadata("design:type", Object)
], WebhookFilterConditionDto.prototype, "value", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Only meaningful for text fields. Defaults to false.' }),
    __metadata("design:type", Boolean)
], WebhookFilterConditionDto.prototype, "caseSensitive", void 0);
class WebhookFiltersDto {
    conditions;
}
__decorate([
    (0, swagger_1.ApiProperty)({
        type: [WebhookFilterConditionDto],
        maxItems: filter_types_1.MAX_CONDITIONS,
        description: 'Every condition must match (AND) for the webhook to fire. An empty list means no filter: the webhook fires on every subscribed event.',
    }),
    __metadata("design:type", Array)
], WebhookFiltersDto.prototype, "conditions", void 0);
const FILTERS_API_DESCRIPTION = 'Optional smart pre-filter. When set, every condition must match (AND) for the webhook to fire. Omit or null to fire on every subscribed event.';
const UPDATE_FILTERS_API_DESCRIPTION = 'Optional smart pre-filter. When set, every condition must match (AND) for the webhook to fire. Omit to keep the stored filters; send null or { conditions: [] } to clear them, so the webhook fires on every subscribed event.';
const FILTERS_API_EXAMPLE = {
    conditions: [
        { field: 'sender', operator: 'is', value: ['1234567890@c.us'] },
        { field: 'body', operator: 'contains', value: 'invoice' },
    ],
};
exports.WEBHOOK_RESERVED_EVENTS = [];
exports.WEBHOOK_EVENTS = [
    'message.received',
    'message.sent',
    'message.ack',
    'message.receipt',
    'message.failed',
    'message.revoked',
    'message.reaction',
    'message.edited',
    'status.received',
    'session.status',
    'session.qr',
    'session.authenticated',
    'session.disconnected',
    'session.reconnect_loop',
    'session.restriction',
    'presence.update',
    'event.response',
    'poll.vote',
    'group.join',
    'group.leave',
    'group.update',
    'group.join_request',
    'call.received',
    'call.accepted',
    'call.rejected',
    'call.missed',
    ...exports.WEBHOOK_RESERVED_EVENTS,
];
const WEBHOOK_URL_OPTIONS = { require_tld: false, require_protocol: true, protocols: ['http', 'https'] };
class CreateWebhookDto {
    url;
    events;
    secret;
    headers;
    filters;
    retryCount;
}
exports.CreateWebhookDto = CreateWebhookDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Webhook URL to receive events',
        example: 'https://your-server.com/webhook',
        maxLength: 2048,
    }),
    (0, class_validator_1.IsUrl)(WEBHOOK_URL_OPTIONS),
    (0, max_code_points_1.MaxCodePoints)(2048),
    __metadata("design:type", String)
], CreateWebhookDto.prototype, "url", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: "Event types to subscribe to. '*' subscribes to all events except `message.receipt`, which must be named explicitly.",
        example: ['message.received', 'session.status'],
        enum: [...exports.WEBHOOK_EVENTS, '*'],
        type: String,
        isArray: true,
        minItems: 1,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictArray)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.IsIn)([...exports.WEBHOOK_EVENTS, '*'], { each: true }),
    __metadata("design:type", Array)
], CreateWebhookDto.prototype, "events", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Secret key for HMAC signature verification. Never returned by any webhook route; it is used to ' +
            'compute the `X-OpenWA-Signature: sha256=<hex>` header on every delivery.',
        minLength: 16,
        maxLength: 255,
        example: 'your-webhook-signing-secret',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(16),
    (0, max_code_points_1.MaxCodePoints)(255),
    __metadata("design:type", String)
], CreateWebhookDto.prototype, "secret", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Custom headers to include in webhook requests. Names must be unique ignoring case. Never returned by ' +
            'any webhook route. At delivery, `content-type`, `user-agent` and `x-openwa-*` names are stripped so a ' +
            'custom header cannot shadow a system one, ' +
            'and so are the connection-level names the HTTP client owns (`connection`, `content-length`, ' +
            '`expect`, `keep-alive`, `te`, `trailer`, `transfer-encoding`, `upgrade`).',
        example: { 'X-Custom-Header': 'value' },
    }),
    (0, class_validator_1.IsOptional)(),
    (0, is_header_map_validator_1.IsHeaderMap)(),
    __metadata("design:type", Object)
], CreateWebhookDto.prototype, "headers", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: WebhookFiltersDto,
        description: FILTERS_API_DESCRIPTION,
        example: FILTERS_API_EXAMPLE,
        nullable: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, filter_validation_1.IsValidWebhookFilters)(),
    __metadata("design:type", Object)
], CreateWebhookDto.prototype, "filters", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Total delivery attempts per event, including the first (0 and 1 both mean a single attempt with no ' +
            'retry). An event that exhausts them is recorded in GET /api/webhooks/delivery-failures; the webhook ' +
            'stays active.',
        example: 3,
        minimum: 0,
        maximum: 5,
    }),
    (0, strict_boolean_1.ToStrictNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], CreateWebhookDto.prototype, "retryCount", void 0);
class UpdateWebhookDto {
    url;
    events;
    secret;
    headers;
    filters;
    active;
    retryCount;
}
exports.UpdateWebhookDto = UpdateWebhookDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Webhook URL', maxLength: 2048 }),
    (0, class_validator_1.ValidateIf)((_, v) => v !== undefined),
    (0, class_validator_1.IsUrl)(WEBHOOK_URL_OPTIONS),
    (0, max_code_points_1.MaxCodePoints)(2048),
    __metadata("design:type", String)
], UpdateWebhookDto.prototype, "url", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: "Event types to subscribe to. '*' subscribes to all events except `message.receipt`, which must be named explicitly.",
        enum: [...exports.WEBHOOK_EVENTS, '*'],
        type: String,
        isArray: true,
        minItems: 1,
    }),
    (0, class_validator_1.ValidateIf)((_, v) => v !== undefined),
    (0, strict_boolean_1.ToStrictArray)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.IsIn)([...exports.WEBHOOK_EVENTS, '*'], { each: true }),
    __metadata("design:type", Array)
], UpdateWebhookDto.prototype, "events", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Secret key for HMAC signature. At least 16 characters, or an empty string to clear it. ' +
            'Never returned by any webhook route.',
        maxLength: 255,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.ValidateIf)((o) => o.secret !== ''),
    (0, class_validator_1.MinLength)(16),
    (0, max_code_points_1.MaxCodePoints)(255),
    __metadata("design:type", String)
], UpdateWebhookDto.prototype, "secret", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Custom headers. Replaces the stored map wholesale. Never returned by any webhook route.',
        example: { 'X-Custom-Header': 'value' },
    }),
    (0, class_validator_1.ValidateIf)((_, v) => v !== undefined),
    (0, is_header_map_validator_1.IsHeaderMap)(),
    __metadata("design:type", Object)
], UpdateWebhookDto.prototype, "headers", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: WebhookFiltersDto,
        description: UPDATE_FILTERS_API_DESCRIPTION,
        example: FILTERS_API_EXAMPLE,
        nullable: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, filter_validation_1.IsValidWebhookFilters)(),
    __metadata("design:type", Object)
], UpdateWebhookDto.prototype, "filters", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Enable/disable webhook' }),
    (0, strict_boolean_1.ToStrictBoolean)(),
    (0, class_validator_1.ValidateIf)((_, v) => v !== undefined),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateWebhookDto.prototype, "active", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Total delivery attempts per event, including the first (0 and 1 both mean a single attempt). Same ' +
            'range the create route enforces.',
        example: 3,
        minimum: 0,
        maximum: 5,
    }),
    (0, strict_boolean_1.ToStrictNumber)(),
    (0, class_validator_1.ValidateIf)((_, v) => v !== undefined),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], UpdateWebhookDto.prototype, "retryCount", void 0);
class WebhookResponseDto {
    id;
    sessionId;
    url;
    events;
    filters;
    active;
    retryCount;
    lastTriggeredAt;
    createdAt;
    updatedAt;
    static fromEntity(entity) {
        return (0, class_transformer_1.plainToInstance)(WebhookResponseDto, entity, { excludeExtraneousValues: true });
    }
    static fromEntities(entities) {
        return entities.map(entity => WebhookResponseDto.fromEntity(entity));
    }
}
exports.WebhookResponseDto = WebhookResponseDto;
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], WebhookResponseDto.prototype, "id", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], WebhookResponseDto.prototype, "sessionId", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], WebhookResponseDto.prototype, "url", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ enum: [...exports.WEBHOOK_EVENTS, '*'], type: String, isArray: true }),
    __metadata("design:type", Array)
], WebhookResponseDto.prototype, "events", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiPropertyOptional)({
        type: WebhookFiltersDto,
        description: FILTERS_API_DESCRIPTION,
        example: FILTERS_API_EXAMPLE,
        nullable: true,
    }),
    __metadata("design:type", Object)
], WebhookResponseDto.prototype, "filters", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], WebhookResponseDto.prototype, "active", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], WebhookResponseDto.prototype, "retryCount", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiPropertyOptional)({ type: String, format: 'date-time', nullable: true }),
    __metadata("design:type", Object)
], WebhookResponseDto.prototype, "lastTriggeredAt", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], WebhookResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], WebhookResponseDto.prototype, "updatedAt", void 0);
class WebhookDeliveryFailureDto {
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
    createdAt;
    replayable;
}
exports.WebhookDeliveryFailureDto = WebhookDeliveryFailureDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '0a941dac-a965-45e7-b318-74ae8be134f0' }),
    __metadata("design:type", String)
], WebhookDeliveryFailureDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '0a941dac-a965-45e7-b318-74ae8be134f0' }),
    __metadata("design:type", String)
], WebhookDeliveryFailureDto.prototype, "webhookId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '0a941dac-a965-45e7-b318-74ae8be134f0' }),
    __metadata("design:type", String)
], WebhookDeliveryFailureDto.prototype, "sessionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'message.received' }),
    __metadata("design:type", String)
], WebhookDeliveryFailureDto.prototype, "event", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'https://receiver.example.com/hook' }),
    __metadata("design:type", String)
], WebhookDeliveryFailureDto.prototype, "url", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: String,
        nullable: true,
        description: 'The idempotency key the receiver would have deduped on.',
    }),
    __metadata("design:type", Object)
], WebhookDeliveryFailureDto.prototype, "idempotencyKey", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: String, nullable: true }),
    __metadata("design:type", Object)
], WebhookDeliveryFailureDto.prototype, "deliveryId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Attempts recorded for the delivery; 0 when it was shed, refused or failed before sending. With the ' +
            'queue disabled, a delivery that shutdown caught in a retry backoff also records 0, although earlier ' +
            'attempts were sent.',
        example: 5,
    }),
    __metadata("design:type", Number)
], WebhookDeliveryFailureDto.prototype, "attempts", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: Number,
        nullable: true,
        description: 'Last HTTP status when the failure was a non-2xx response; null for a network/timeout error.',
        example: null,
    }),
    __metadata("design:type", Object)
], WebhookDeliveryFailureDto.prototype, "lastStatusCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'fetch failed' }),
    __metadata("design:type", String)
], WebhookDeliveryFailureDto.prototype, "lastError", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: String, format: 'date-time', description: 'When the failure was first recorded.' }),
    __metadata("design:type", Date)
], WebhookDeliveryFailureDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'True when the row still holds the event data and its webhook still exists in the same session. Only ' +
            'terminal rows (attempts > 0) recorded while `WEBHOOK_FAILURE_PAYLOAD_RETENTION_HOURS` > 0 hold it, until ' +
            'that window passes. `POST /webhooks/delivery-failures/redrive` replays such a row while its webhook is ' +
            'active and subscribed to the event, so a row of a disabled or unsubscribed webhook stays replayable for ' +
            'when the webhook is switched back.',
        example: false,
    }),
    __metadata("design:type", Boolean)
], WebhookDeliveryFailureDto.prototype, "replayable", void 0);
class RedriveWebhookDeliveriesDto {
    sessionId;
    webhookId;
    ids;
    limit;
}
exports.RedriveWebhookDeliveriesDto = RedriveWebhookDeliveriesDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: "Only rows of this session. Narrows within the calling key's allowedSessions, never past it.",
        example: 'my-session',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(128),
    __metadata("design:type", String)
], RedriveWebhookDeliveriesDto.prototype, "sessionId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Only rows of this webhook.', example: '0a941dac-a965-45e7-b318-74ae8be134f0' }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(128),
    __metadata("design:type", String)
], RedriveWebhookDeliveriesDto.prototype, "webhookId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: [String],
        description: 'Only these failure rows (ids from `GET /webhooks/delivery-failures`).',
        example: ['0a941dac-a965-45e7-b318-74ae8be134f0'],
        maxItems: 500,
        items: { type: 'string', maxLength: 128 },
    }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictArray)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(500),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.MaxLength)(128, { each: true }),
    __metadata("design:type", Array)
], RedriveWebhookDeliveriesDto.prototype, "ids", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Max rows replayed by this call (1-500, default 100).',
        example: 100,
        minimum: 1,
        maximum: 500,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(500),
    __metadata("design:type", Number)
], RedriveWebhookDeliveriesDto.prototype, "limit", void 0);
class WebhookRedriveResultDto {
    redriven;
    delivered;
    enqueued;
    failed;
    skipped;
    remaining;
}
exports.WebhookRedriveResultDto = WebhookRedriveResultDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Rows replayed by this call; equals delivered.', example: 2 }),
    __metadata("design:type", Number)
], WebhookRedriveResultDto.prototype, "redriven", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Delivered by a direct POST; their failure rows were removed.', example: 2 }),
    __metadata("design:type", Number)
], WebhookRedriveResultDto.prototype, "delivered", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Reserved for response compatibility; operator redrive uses direct POST and returns zero.',
        example: 0,
    }),
    __metadata("design:type", Number)
], WebhookRedriveResultDto.prototype, "enqueued", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Replays that failed again; their rows stay, with attempts raised by one.', example: 0 }),
    __metadata("design:type", Number)
], WebhookRedriveResultDto.prototype, "failed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Selected rows not replayed: a hook cancelled the replay, or the row or its webhook changed during the call. ' +
            'Rows of a removed, disabled or unsubscribed webhook are left out before the batch and not counted.',
        example: 0,
    }),
    __metadata("design:type", Number)
], WebhookRedriveResultDto.prototype, "skipped", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Rows the redrive would still take after this call: replayable, in scope, with an active webhook subscribed ' +
            'to the event.',
        example: 0,
    }),
    __metadata("design:type", Number)
], WebhookRedriveResultDto.prototype, "remaining", void 0);
class WebhookTestResponseDto {
    success;
    statusCode;
    error;
}
exports.WebhookTestResponseDto = WebhookTestResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'True when the receiver answered 2xx.', example: true }),
    __metadata("design:type", Boolean)
], WebhookTestResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'The HTTP status the receiver answered, when it answered.', example: 200 }),
    __metadata("design:type", Number)
], WebhookTestResponseDto.prototype, "statusCode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'The delivery error, when the attempt failed.', example: 'timeout' }),
    __metadata("design:type", String)
], WebhookTestResponseDto.prototype, "error", void 0);
//# sourceMappingURL=webhook.dto.js.map