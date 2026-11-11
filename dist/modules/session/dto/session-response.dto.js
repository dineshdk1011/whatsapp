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
exports.QRCodeResponseDto = exports.SessionResponseDto = exports.AccountRestrictionDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const session_entity_1 = require("../entities/session.entity");
class AccountRestrictionDto {
    kind;
    code;
    expiresAt;
}
exports.AccountRestrictionDto = AccountRestrictionDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: ['reachout_timelock', 'tos_block', 'proxy_block'],
        description: 'What WhatsApp is restricting. `reachout_timelock` leaves the session connected and existing ' +
            'chats working, blocking only the start of new conversations. `tos_block` and `proxy_block` ' +
            'are connection-level refusals — the session cannot stay linked while one is in force, so ' +
            'seeing either alongside a `ready` status is not possible.',
        example: 'reachout_timelock',
    }),
    __metadata("design:type", String)
], AccountRestrictionDto.prototype, "kind", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "The engine's own token for the cause, passed through verbatim so it can be searched for and " +
            'so a value newer than this gateway is still surfaced rather than flattened.',
        example: 'BIZ_QUALITY',
    }),
    __metadata("design:type", String)
], AccountRestrictionDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: String,
        format: 'date-time',
        description: 'When enforcement ends, if the engine states it. Only reachout timelocks carry an expiry; ' +
            'absent means the engine gave no end time, not that the restriction is permanent.',
        example: '2026-08-04T09:00:00Z',
        nullable: true,
    }),
    __metadata("design:type", Object)
], AccountRestrictionDto.prototype, "expiresAt", void 0);
class SessionResponseDto {
    id;
    name;
    status;
    phone;
    pushName;
    connectedAt;
    lastActive;
    createdAt;
    updatedAt;
    lastError;
    restriction;
    engineLoaded;
    static fromEntity(session, engineLoaded) {
        return {
            id: session.id,
            name: session.name,
            status: session.status,
            phone: session.phone,
            pushName: session.pushName,
            connectedAt: session.connectedAt,
            lastActive: session.lastActiveAt,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
            lastError: session.lastError ?? null,
            restriction: session.restriction
                ? {
                    kind: session.restriction.kind,
                    code: session.restriction.code,
                    expiresAt: session.restriction.expiresAt ? new Date(session.restriction.expiresAt) : null,
                }
                : null,
            engineLoaded,
        };
    }
}
exports.SessionResponseDto = SessionResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '0a941dac-a965-45e7-b318-74ae8be134f0' }),
    __metadata("design:type", String)
], SessionResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'my-bot' }),
    __metadata("design:type", String)
], SessionResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: session_entity_1.SessionStatus, example: session_entity_1.SessionStatus.READY }),
    __metadata("design:type", String)
], SessionResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: String, example: '628123456789', nullable: true }),
    __metadata("design:type", Object)
], SessionResponseDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: String, example: 'John Doe', nullable: true }),
    __metadata("design:type", Object)
], SessionResponseDto.prototype, "pushName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: String, format: 'date-time', example: '2025-02-02T10:00:00Z', nullable: true }),
    __metadata("design:type", Object)
], SessionResponseDto.prototype, "connectedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: String, format: 'date-time', example: '2025-02-02T10:30:00Z', nullable: true }),
    __metadata("design:type", Object)
], SessionResponseDto.prototype, "lastActive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2025-02-02T09:00:00Z' }),
    __metadata("design:type", Date)
], SessionResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2025-02-02T10:00:00Z' }),
    __metadata("design:type", Date)
], SessionResponseDto.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: String,
        description: 'Human-readable reason carried while the status is FAILED (a terminal engine failure), ' +
            'ACTION_REQUIRED (the engine is running but something needs a human), or INITIALIZING from the ' +
            'fifth consecutive reconnect attempt of a session whose engine retries a dropped connection on its own, ' +
            'until the session is ready or a QR arrives. A QR window that runs out unscanned is not an attempt. ' +
            'INITIALIZING also carries it while a reconnect waits to retry after the engine failed to relaunch. ' +
            'Held in memory by the process running the session. Cleared on any other status.',
        example: 'Failed to launch the browser process: spawn /usr/bin/chromium ENOENT',
        nullable: true,
    }),
    __metadata("design:type", Object)
], SessionResponseDto.prototype, "lastError", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: AccountRestrictionDto,
        description: "A restriction WhatsApp itself has placed on this session's account, or null when there is " +
            'none. Distinct from `lastError`, which describes a fault on our side of the link. Derived ' +
            'from live engine state, so it is never persisted: it is re-established on the next connect.',
        nullable: true,
    }),
    __metadata("design:type", Object)
], SessionResponseDto.prototype, "restriction", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Whether the gateway currently holds a live engine for this session: an engine in the answering ' +
            'process or, in a multi-node deployment, a live claim by the node running the session. `status` ' +
            'alone does not imply it: a `disconnected` session keeps its engine for the duration of an automatic ' +
            'reconnect backoff, while a session stopped through `POST /sessions/:sessionId/stop` carries the same ' +
            'status with no engine. On the node running the session, `true` means `stop`, `logout` and ' +
            '`force-kill` can act and `start` answers 400; `false` means the reverse. For a session another node ' +
            'runs, request routing (NODE_URL set on every node) forwards the lifecycle routes to that node, where ' +
            'they act; without routing, only that node can act on it, and any other node answers 409 to `start` ' +
            'and `stop` and 400 to `logout` and `force-kill`. Derived per request from live state, so it is never ' +
            'persisted and never historical.',
        example: true,
    }),
    __metadata("design:type", Boolean)
], SessionResponseDto.prototype, "engineLoaded", void 0);
class QRCodeResponseDto {
    qrCode;
    status;
}
exports.QRCodeResponseDto = QRCodeResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'QR code as data URL',
        example: 'data:image/png;base64,...',
    }),
    __metadata("design:type", String)
], QRCodeResponseDto.prototype, "qrCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: session_entity_1.SessionStatus, example: session_entity_1.SessionStatus.QR_READY }),
    __metadata("design:type", String)
], QRCodeResponseDto.prototype, "status", void 0);
//# sourceMappingURL=session-response.dto.js.map