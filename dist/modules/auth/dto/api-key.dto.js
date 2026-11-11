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
exports.UpdateApiKeyDto = exports.ValidateApiKeyResponseDto = exports.ApiKeyCreatedResponseDto = exports.ApiKeyResponseDto = exports.CreateApiKeyDto = exports.ALLOWED_CHATS_MAX = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const strict_boolean_1 = require("../../../common/utils/strict-boolean");
const max_code_points_1 = require("../../../common/validation/max-code-points");
const api_key_entity_1 = require("../entities/api-key.entity");
const is_ip_or_cidr_validator_1 = require("./is-ip-or-cidr.validator");
const is_session_id_validator_1 = require("./is-session-id.validator");
const is_chat_id_validator_1 = require("./is-chat-id.validator");
exports.ALLOWED_CHATS_MAX = 2000;
class CreateApiKeyDto {
    name;
    role;
    allowedIps;
    allowedSessions;
    allowedChats;
    expiresAt;
}
exports.CreateApiKeyDto = CreateApiKeyDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Friendly name for the API key',
        example: 'Production Bot',
        minLength: 3,
        maxLength: 100,
    }),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    (0, max_code_points_1.MaxCodePoints)(100),
    __metadata("design:type", String)
], CreateApiKeyDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Role/permission level',
        enum: api_key_entity_1.ApiKeyRole,
        default: api_key_entity_1.ApiKeyRole.OPERATOR,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(api_key_entity_1.ApiKeyRole),
    __metadata("design:type", String)
], CreateApiKeyDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Allowed IP addresses (whitelist)',
        example: ['192.168.1.1', '10.0.0.0/8'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictArray)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.Validate)(is_ip_or_cidr_validator_1.IsIpOrCidrConstraint, { each: true }),
    __metadata("design:type", Array)
], CreateApiKeyDto.prototype, "allowedIps", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Session **ids** this key may act on — the server-generated UUIDs, not session names. Matched by ' +
            'exact equality against the id in the request path, so a name never matches and would silently ' +
            'scope the key to nothing. Omit or leave empty to let the key reach every session.',
        example: ['0a941dac-a965-45e7-b318-74ae8be134f0', '8f3c2b1a-9d4e-4c7a-8b2f-1e6d5a4c3b2a'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictArray)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.ArrayUnique)(),
    (0, class_validator_1.Validate)(is_session_id_validator_1.IsSessionIdConstraint, { each: true }),
    __metadata("design:type", Array)
], CreateApiKeyDto.prototype, "allowedSessions", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Chat ids this key may read and send to — a curated allowlist independent of `allowedSessions`. ' +
            'Entries are a group `<id>@g.us`, a contact `<phone>@c.us` / `<lid>@lid`, or a bare phone number. ' +
            'A contact entry also matches its resolved `@lid` form (and vice versa) through the lid mapping ' +
            'table. Omit or leave empty to let the key reach every chat.',
        example: ['120363000000000000@g.us', '919999999999@c.us'],
        maxItems: exports.ALLOWED_CHATS_MAX,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictArray)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(exports.ALLOWED_CHATS_MAX),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.ArrayUnique)(),
    (0, class_validator_1.Validate)(is_chat_id_validator_1.IsChatIdConstraint, { each: true }),
    __metadata("design:type", Array)
], CreateApiKeyDto.prototype, "allowedChats", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Expiration date (ISO 8601)',
        example: '2027-12-31T23:59:59Z',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateApiKeyDto.prototype, "expiresAt", void 0);
class ApiKeyResponseDto {
    id;
    name;
    keyPrefix;
    role;
    allowedIps;
    allowedSessions;
    allowedChats;
    isActive;
    expiresAt;
    lastUsedAt;
    usageCount;
    createdAt;
}
exports.ApiKeyResponseDto = ApiKeyResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ApiKeyResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ApiKeyResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'First 12 characters of the key (for identification)',
    }),
    __metadata("design:type", String)
], ApiKeyResponseDto.prototype, "keyPrefix", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: api_key_entity_1.ApiKeyRole }),
    __metadata("design:type", String)
], ApiKeyResponseDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Array)
], ApiKeyResponseDto.prototype, "allowedIps", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Array)
], ApiKeyResponseDto.prototype, "allowedSessions", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Array)
], ApiKeyResponseDto.prototype, "allowedChats", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], ApiKeyResponseDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Date)
], ApiKeyResponseDto.prototype, "expiresAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Date)
], ApiKeyResponseDto.prototype, "lastUsedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ApiKeyResponseDto.prototype, "usageCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], ApiKeyResponseDto.prototype, "createdAt", void 0);
class ApiKeyCreatedResponseDto extends ApiKeyResponseDto {
    apiKey;
}
exports.ApiKeyCreatedResponseDto = ApiKeyCreatedResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Full API key (only shown once at creation)',
        example: 'owa_k1_abc123...',
    }),
    __metadata("design:type", String)
], ApiKeyCreatedResponseDto.prototype, "apiKey", void 0);
class ValidateApiKeyResponseDto {
    valid;
    role;
    engineType;
    scoped;
}
exports.ValidateApiKeyResponseDto = ValidateApiKeyResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether the presented API key is valid.', example: true }),
    __metadata("design:type", Boolean)
], ValidateApiKeyResponseDto.prototype, "valid", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: api_key_entity_1.ApiKeyRole, description: "The key's role; present only when valid." }),
    __metadata("design:type", String)
], ValidateApiKeyResponseDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Engine the process resolved at boot; present only when valid.',
        example: 'baileys',
    }),
    __metadata("design:type", String)
], ValidateApiKeyResponseDto.prototype, "engineType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Whether the key is restricted to selected sessions; present only when valid.',
        example: false,
    }),
    __metadata("design:type", Boolean)
], ValidateApiKeyResponseDto.prototype, "scoped", void 0);
class UpdateApiKeyDto {
    name;
    role;
    allowedIps;
    allowedSessions;
    allowedChats;
    expiresAt;
}
exports.UpdateApiKeyDto = UpdateApiKeyDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ minLength: 3, maxLength: 100 }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    (0, max_code_points_1.MaxCodePoints)(100),
    __metadata("design:type", String)
], UpdateApiKeyDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: api_key_entity_1.ApiKeyRole }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(api_key_entity_1.ApiKeyRole),
    __metadata("design:type", String)
], UpdateApiKeyDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictArray)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.Validate)(is_ip_or_cidr_validator_1.IsIpOrCidrConstraint, { each: true }),
    __metadata("design:type", Array)
], UpdateApiKeyDto.prototype, "allowedIps", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictArray)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.ArrayUnique)(),
    (0, class_validator_1.Validate)(is_session_id_validator_1.IsSessionIdConstraint, { each: true }),
    __metadata("design:type", Array)
], UpdateApiKeyDto.prototype, "allowedSessions", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ maxItems: exports.ALLOWED_CHATS_MAX }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictArray)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(exports.ALLOWED_CHATS_MAX),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.ArrayUnique)(),
    (0, class_validator_1.Validate)(is_chat_id_validator_1.IsChatIdConstraint, { each: true }),
    __metadata("design:type", Array)
], UpdateApiKeyDto.prototype, "allowedChats", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: String,
        nullable: true,
        description: 'Expiration date (ISO 8601); null clears it (an empty string is rejected)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", Object)
], UpdateApiKeyDto.prototype, "expiresAt", void 0);
//# sourceMappingURL=api-key.dto.js.map