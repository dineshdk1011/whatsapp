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
exports.RedriveResultDto = exports.InstanceView = exports.UpdateInstanceDto = exports.CreateInstanceDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const ingress_url_1 = require("../ingress-url");
const strict_boolean_1 = require("../../../common/utils/strict-boolean");
const INSTANCE_ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;
class CreateInstanceDto {
    instanceId;
    sessionScope;
    verifyToken;
    secret;
    config;
}
exports.CreateInstanceDto = CreateInstanceDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Operator-chosen instance id (unique within the plugin). Namespaces the ingress URL and the instance secret.',
        pattern: INSTANCE_ID_PATTERN.source,
        example: 'chatwoot-prod-1',
    }),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(INSTANCE_ID_PATTERN, { message: 'instanceId must match ^[a-zA-Z0-9_-]{1,64}$' }),
    __metadata("design:type", String)
], CreateInstanceDto.prototype, "instanceId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Session id the instance is scoped to. Omit for all sessions.',
        minLength: 1,
        maxLength: 256,
        example: '8f3c2b1a-9d4e-4c7a-8b2f-1e6d5a4c3b2a',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'sessionScope must not be empty (omit it for all sessions)' }),
    (0, class_validator_1.MaxLength)(256),
    __metadata("design:type", String)
], CreateInstanceDto.prototype, "sessionScope", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Token echoed back for the provider webhook verification handshake. Auto-generated when omitted.',
        maxLength: 512,
        example: 'a1b2c3d4e5f6',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(512),
    __metadata("design:type", String)
], CreateInstanceDto.prototype, "verifyToken", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: "Ingress HMAC secret shared with the provider. Omit to auto-generate a random 64-hex secret. Masked ('***') on every later read; plaintext returned only once on create/regenerate-secret.",
        writeOnly: true,
        minLength: 16,
        maxLength: 512,
        example: 'super-secret-provider-webhook-key',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(16, { message: 'secret must be at least 16 characters' }),
    (0, class_validator_1.MaxLength)(512),
    __metadata("design:type", String)
], CreateInstanceDto.prototype, "secret", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Per-instance config slice passed to the adapter (shape defined by the plugin).',
        example: { apiKey: 'chatwoot-key', inboxId: 42 },
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateInstanceDto.prototype, "config", void 0);
class UpdateInstanceDto {
    enabled;
    sessionScope;
    config;
}
exports.UpdateInstanceDto = UpdateInstanceDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Whether the instance is enabled (ingress accepted, dispatch active).',
        example: true,
    }),
    (0, strict_boolean_1.ToStrictBoolean)(),
    (0, class_validator_1.ValidateIf)((o) => o.enabled !== undefined),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateInstanceDto.prototype, "enabled", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Session id to bind the instance to, or null for all sessions. Omit to leave the scope unchanged.',
        nullable: true,
        type: String,
        minLength: 1,
        maxLength: 256,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'sessionScope must not be empty (send null for all sessions)' }),
    (0, class_validator_1.MaxLength)(256),
    __metadata("design:type", Object)
], UpdateInstanceDto.prototype, "sessionScope", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Per-instance config slice passed to the adapter.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], UpdateInstanceDto.prototype, "config", void 0);
class InstanceView {
    id;
    pluginId;
    instanceId;
    sessionScope;
    secret;
    verifyToken;
    config;
    enabled;
    createdAt;
    updatedAt;
    ingressUrls;
}
exports.InstanceView = InstanceView;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Instance row id.' }),
    __metadata("design:type", String)
], InstanceView.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Plugin id this instance belongs to.' }),
    __metadata("design:type", String)
], InstanceView.prototype, "pluginId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Operator-chosen instance id (unique within the plugin).' }),
    __metadata("design:type", String)
], InstanceView.prototype, "instanceId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Session id the instance is scoped to, or null for all sessions.',
        nullable: true,
        type: String,
    }),
    __metadata("design:type", Object)
], InstanceView.prototype, "sessionScope", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "Ingress HMAC secret. Masked ('***') on every read; plaintext returned only once on create/regenerate-secret.",
    }),
    __metadata("design:type", String)
], InstanceView.prototype, "secret", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: "Provider verify-token. Masked ('***') on reads when set; plaintext on create/regenerate-secret.",
        nullable: true,
        type: String,
    }),
    __metadata("design:type", Object)
], InstanceView.prototype, "verifyToken", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: "Per-instance config slice passed to the adapter, or null. Fields flagged `secret` in the plugin's config schema are masked ('***') on EVERY response — including create/regenerate-secret; only the ingress secret and verifyToken are ever revealed once.",
        nullable: true,
        type: Object,
    }),
    __metadata("design:type", Object)
], InstanceView.prototype, "config", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether ingress is accepted and dispatch is active.' }),
    __metadata("design:type", Boolean)
], InstanceView.prototype, "enabled", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Creation timestamp.' }),
    __metadata("design:type", Date)
], InstanceView.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Last update timestamp.' }),
    __metadata("design:type", Date)
], InstanceView.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Ingress URLs the provider posts webhook deliveries to.',
        type: () => ingress_url_1.IngressUrl,
        isArray: true,
    }),
    __metadata("design:type", Array)
], InstanceView.prototype, "ingressUrls", void 0);
class RedriveResultDto {
    redriven;
    remaining;
    batchSize;
}
exports.RedriveResultDto = RedriveResultDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Deliveries re-dispatched by this call.', example: 25 }),
    __metadata("design:type", Number)
], RedriveResultDto.prototype, "redriven", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Dead-lettered deliveries still retained after this batch.', example: 75 }),
    __metadata("design:type", Number)
], RedriveResultDto.prototype, "remaining", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The bounded batch size this call processed.', example: 100 }),
    __metadata("design:type", Number)
], RedriveResultDto.prototype, "batchSize", void 0);
//# sourceMappingURL=instance.dto.js.map