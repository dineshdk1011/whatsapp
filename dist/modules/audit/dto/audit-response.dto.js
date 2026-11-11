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
exports.AuditListResponseDto = exports.AuditLogDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class AuditLogDto {
    id;
    action;
    severity;
    apiKeyId;
    apiKeyName;
    sessionId;
    sessionName;
    ipAddress;
    userAgent;
    method;
    path;
    statusCode;
    metadata;
    errorMessage;
    createdAt;
}
exports.AuditLogDto = AuditLogDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '4f1c9b2a-8d3e-4c5b-9a17-2e6f0b4d8c31' }),
    __metadata("design:type", String)
], AuditLogDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'What happened.', example: 'session_started' }),
    __metadata("design:type", String)
], AuditLogDto.prototype, "action", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['info', 'warn', 'error'], example: 'info' }),
    __metadata("design:type", String)
], AuditLogDto.prototype, "severity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: String, nullable: true, description: 'Null for an unauthenticated or system action.' }),
    __metadata("design:type", Object)
], AuditLogDto.prototype, "apiKeyId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: String, nullable: true }),
    __metadata("design:type", Object)
], AuditLogDto.prototype, "apiKeyName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: String, nullable: true, description: 'Null for a deployment-global action.' }),
    __metadata("design:type", Object)
], AuditLogDto.prototype, "sessionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: String, nullable: true }),
    __metadata("design:type", Object)
], AuditLogDto.prototype, "sessionName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: String, nullable: true }),
    __metadata("design:type", Object)
], AuditLogDto.prototype, "ipAddress", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: String, nullable: true }),
    __metadata("design:type", Object)
], AuditLogDto.prototype, "userAgent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: String, nullable: true, example: 'POST' }),
    __metadata("design:type", Object)
], AuditLogDto.prototype, "method", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: String, nullable: true, example: '/api/sessions' }),
    __metadata("design:type", Object)
], AuditLogDto.prototype, "path", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: Number, nullable: true, example: 201 }),
    __metadata("design:type", Object)
], AuditLogDto.prototype, "statusCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: Object,
        nullable: true,
        description: 'Free-form context for the action. Shape varies per action and is not part of the contract.',
    }),
    __metadata("design:type", Object)
], AuditLogDto.prototype, "metadata", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: String, nullable: true, description: 'Present only for a failed action.' }),
    __metadata("design:type", Object)
], AuditLogDto.prototype, "errorMessage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ISO-8601 timestamp the entry was written.', example: '2026-08-07T12:00:00.000Z' }),
    __metadata("design:type", String)
], AuditLogDto.prototype, "createdAt", void 0);
class AuditListResponseDto {
    data;
    total;
}
exports.AuditListResponseDto = AuditListResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        type: [AuditLogDto],
        description: 'The requested page. A session-scoped API key sees only entries within its scope.',
    }),
    __metadata("design:type", Array)
], AuditListResponseDto.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total matching entries, for paging.', example: 128 }),
    __metadata("design:type", Number)
], AuditListResponseDto.prototype, "total", void 0);
//# sourceMappingURL=audit-response.dto.js.map