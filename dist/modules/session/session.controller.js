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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const session_service_1 = require("./session.service");
const dto_1 = require("./dto");
const paginate_1 = require("../../common/utils/paginate");
const audit_service_1 = require("../audit/audit.service");
const audit_log_entity_1 = require("../audit/entities/audit-log.entity");
const auth_decorators_1 = require("../auth/decorators/auth.decorators");
const chat_scope_service_1 = require("../auth/chat-scope.service");
const api_key_entity_1 = require("../auth/entities/api-key.entity");
const engine_status_responses_1 = require("../../common/openapi/engine-status-responses");
let SessionController = class SessionController {
    sessionService;
    auditService;
    chatScope;
    constructor(sessionService, auditService, chatScope) {
        this.sessionService = sessionService;
        this.auditService = auditService;
        this.chatScope = chatScope;
    }
    transformSession(session) {
        return dto_1.SessionResponseDto.fromEntity(session, this.sessionService.engineLoaded(session));
    }
    async create(dto, apiKey) {
        if (dto.proxyUrl && apiKey?.role !== api_key_entity_1.ApiKeyRole.ADMIN) {
            throw new common_1.ForbiddenException('Setting proxyUrl requires an ADMIN key');
        }
        const session = await this.sessionService.create(dto);
        await this.auditService.logInfo(audit_log_entity_1.AuditAction.SESSION_CREATED, {
            sessionId: session.id,
            sessionName: session.name,
        });
        return this.transformSession(session);
    }
    async findAll(apiKey, limit, offset, name) {
        if (Array.isArray(name) || name === '') {
            throw new common_1.BadRequestException('name must be a single non-empty value');
        }
        const sessions = await this.sessionService.findAll(apiKey?.allowedSessions, {
            limit: limit ? parseInt(limit, 10) : undefined,
            offset: offset ? parseInt(offset, 10) : undefined,
            name,
        });
        return sessions.map(s => this.transformSession(s));
    }
    async findOne(id) {
        const session = await this.sessionService.findOne(id);
        return this.transformSession(session);
    }
    async getConfig(id) {
        return this.sessionService.getConfig(id);
    }
    async updateConfig(id, dto) {
        const config = await this.sessionService.updateConfig(id, dto);
        await this.auditService.logInfo(audit_log_entity_1.AuditAction.SESSION_CONFIG_UPDATED, {
            sessionId: id,
            metadata: { ...config },
        });
        return config;
    }
    async getProxy(id) {
        return this.sessionService.getProxy(id);
    }
    async updateProxy(id, dto) {
        const proxy = await this.sessionService.updateProxy(id, dto);
        await this.auditService.logInfo(audit_log_entity_1.AuditAction.SESSION_CONFIG_UPDATED, {
            sessionId: id,
            metadata: { proxyEnabled: proxy.enabled, proxyType: proxy.proxyType, proxyHost: proxy.proxyHost },
        });
        return proxy;
    }
    async delete(id) {
        const session = await this.sessionService.findOne(id);
        await this.sessionService.delete(id);
        await this.auditService.logInfo(audit_log_entity_1.AuditAction.SESSION_DELETED, {
            sessionId: id,
            sessionName: session.name,
        });
    }
    async start(id) {
        const session = await this.sessionService.start(id, { explicit: true });
        await this.auditService.logInfo(audit_log_entity_1.AuditAction.SESSION_STARTED, {
            sessionId: session.id,
            sessionName: session.name,
        });
        return this.transformSession(session);
    }
    async stop(id) {
        const session = await this.sessionService.stop(id);
        await this.auditService.logInfo(audit_log_entity_1.AuditAction.SESSION_STOPPED, {
            sessionId: session.id,
            sessionName: session.name,
        });
        return this.transformSession(session);
    }
    async logout(id) {
        const session = await this.sessionService.logout(id);
        await this.auditService.logInfo(audit_log_entity_1.AuditAction.SESSION_LOGGED_OUT, {
            sessionId: session.id,
            sessionName: session.name,
        });
        return this.transformSession(session);
    }
    async forceKill(id) {
        const session = await this.sessionService.forceKill(id);
        await this.auditService.logInfo(audit_log_entity_1.AuditAction.SESSION_FORCE_KILLED, {
            sessionId: session.id,
            sessionName: session.name,
        });
        return this.transformSession(session);
    }
    async getQRCode(id) {
        const qrCode = await this.sessionService.getQRCode(id);
        await this.auditService.logInfo(audit_log_entity_1.AuditAction.SESSION_QR_GENERATED, {
            sessionId: id,
        });
        return qrCode;
    }
    async requestPairingCode(id, dto) {
        return this.sessionService.requestPairingCode(id, dto.phoneNumber);
    }
    async getGroups(id, apiKey, limit, offset) {
        const visible = await this.chatScope.filter(apiKey, await this.sessionService.listGroups(id), g => g.id);
        return (0, paginate_1.paginate)(visible, limit ? parseInt(limit, 10) : undefined, offset ? parseInt(offset, 10) : undefined);
    }
    async getChats(id, apiKey, limit, offset) {
        const skip = offset ? parseInt(offset, 10) : undefined;
        const visible = await this.chatScope.filter(apiKey, await this.sessionService.listChats(id, skip), chat => chat.id);
        return (0, paginate_1.paginate)(visible, limit ? parseInt(limit, 10) : undefined, skip);
    }
    async markChatRead(id, dto) {
        const success = await this.sessionService.sendSeen(id, dto.chatId, dto.messageIds);
        return { success };
    }
    async subscribeToPresence(id, dto) {
        await this.sessionService.subscribeToPresence(id, dto.chatId);
        return { success: true };
    }
    async setOnlinePresence(id, dto) {
        await this.sessionService.setOnlinePresence(id, dto.available);
        return { success: true };
    }
    async getPresence(id, chatId, res) {
        const presence = await this.sessionService.getPresence(id, chatId);
        const body = presence
            ? { ...presence, observedAt: new Date(presence.observedAt) }
            : null;
        res.json(body);
    }
    async markChatUnread(id, dto) {
        const success = await this.sessionService.markUnread(id, dto.chatId);
        return { success };
    }
    async clearChatMessages(id, chatId) {
        const success = await this.sessionService.clearChatMessages(id, chatId);
        return { success };
    }
    async archiveChat(id, dto) {
        const success = await this.sessionService.archiveChat(id, dto.chatId, dto.archive);
        return { success };
    }
    async muteChat(id, dto) {
        await this.sessionService.muteChat(id, dto.chatId, dto.muteUntil);
        return { success: true };
    }
    async pinChat(id, dto) {
        const success = await this.sessionService.pinChat(id, dto.chatId, dto.pin);
        return { success };
    }
    async deleteChat(id, dto) {
        const success = await this.sessionService.deleteChat(id, dto.chatId);
        return { success };
    }
    async sendChatState(id, dto) {
        await this.sessionService.sendChatState(id, dto.chatId, dto.state);
        return { success: true };
    }
    async getStats(apiKey) {
        return this.sessionService.getStats(apiKey?.allowedSessions);
    }
};
exports.SessionController = SessionController;
__decorate([
    (0, common_1.Post)(),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, auth_decorators_1.RequireUnscopedKey)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new WhatsApp session' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Session created',
        type: dto_1.SessionResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Key lacks the OPERATOR role, is restricted to specific sessions, or set proxyUrl without the ADMIN role',
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation failed, or the body carries a field the DTO does not declare.' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Session name already exists' }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'On SQLite, another database transaction stayed open for 10 s; nothing was stored, so retry.',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, auth_decorators_1.CurrentApiKey)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateSessionDto, api_key_entity_1.ApiKey]),
    __metadata("design:returntype", Promise)
], SessionController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all sessions' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'List of sessions',
        type: [dto_1.SessionResponseDto],
    }),
    (0, swagger_1.ApiQuery)({
        name: 'limit',
        required: false,
        type: 'integer',
        description: 'Max sessions to return (1-1000, default 1000)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'offset',
        required: false,
        type: 'integer',
        description: 'Number of sessions to skip (for paging)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'name',
        required: false,
        type: String,
        description: 'Return only the session with exactly this name (case-sensitive); no match returns an empty array. ' +
            'An empty value or a repeated key is rejected with 400.',
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: '`name` is empty or repeated.' }),
    __param(0, (0, auth_decorators_1.CurrentApiKey)()),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('offset')),
    __param(3, (0, common_1.Query)('name')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [api_key_entity_1.ApiKey, String, String, Object]),
    __metadata("design:returntype", Promise)
], SessionController.prototype, "findAll", null);
__decorate([
    (0, auth_decorators_1.ChatScoped)('agnostic'),
    (0, common_1.Get)(':sessionId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get session by ID' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Session details',
        type: dto_1.SessionResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'The session id is not a UUID' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Session not found' }),
    __param(0, (0, common_1.Param)('sessionId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SessionController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':sessionId/config'),
    (0, swagger_1.ApiOperation)({ summary: 'Get the tunable configuration for a session' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Effective session configuration',
        type: dto_1.SessionConfigResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'The session id is not a UUID' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Session not found' }),
    __param(0, (0, common_1.Param)('sessionId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SessionController.prototype, "getConfig", null);
__decorate([
    (0, common_1.Patch)(':sessionId/config'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({
        summary: 'Update the tunable configuration for a session',
        description: 'Merges the supplied keys into the session config; omitted keys are left unchanged and an ' +
            'explicit null clears a key back to its default. No restart is required or performed. ' +
            '`autoRejectCalls` is re-read on every incoming call, so it applies immediately; the two ' +
            'reconnect settings are read once per start and therefore apply on the next start.',
    }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Updated session configuration',
        type: dto_1.SessionConfigResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'A supplied value is outside its accepted range' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Session not found' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'The session config kept changing under concurrent requests; retry' }),
    __param(0, (0, common_1.Param)('sessionId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateSessionConfigDto]),
    __metadata("design:returntype", Promise)
], SessionController.prototype, "updateConfig", null);
__decorate([
    (0, common_1.Get)(':sessionId/proxy'),
    (0, swagger_1.ApiOperation)({ summary: 'Get the per-session egress proxy configuration (credentials masked)' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Effective proxy configuration',
        type: dto_1.SessionProxyResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'The session id is not a UUID' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Session not found' }),
    __param(0, (0, common_1.Param)('sessionId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SessionController.prototype, "getProxy", null);
__decorate([
    (0, common_1.Patch)(':sessionId/proxy'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.ADMIN),
    (0, auth_decorators_1.RequireUnscopedKey)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Update the per-session egress proxy configuration',
        description: 'Sets or clears the proxy URL. Credentials in `proxyUrl` are stored but never returned by GET. ' +
            'No restart is performed — changes apply on the next session start.',
    }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Updated proxy configuration',
        type: dto_1.SessionProxyResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid proxyUrl' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Key lacks the ADMIN role, or is restricted to specific sessions' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Session not found' }),
    __param(0, (0, common_1.Param)('sessionId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateSessionProxyDto]),
    __metadata("design:returntype", Promise)
], SessionController.prototype, "updateProxy", null);
__decorate([
    (0, common_1.Delete)(':sessionId'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a session' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Session deleted' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'The session id is not a UUID' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Session not found' }),
    (0, swagger_1.ApiResponse)({
        status: 409,
        description: 'A credential teardown for the same session name is still in flight (retryable: the body ' +
            "carries `code: 'SESSION_NAME_TEARDOWN_PENDING'`; wait for it to settle and retry), OR " +
            "another node currently holds this session's live engine and deleting it here would strip a " +
            'session the owner is running, OR ownership changes while deletion runs. The first two refusals ' +
            'remove nothing. Ownership loss stops later deletion units; earlier batches may already be committed.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'The session could not be claimed for the delete because the database did not answer (nothing is ' +
            'deleted), or, on SQLite, another database transaction stayed open for 10 s before a delete ' +
            'transaction (no further rows are removed). Retry the delete.',
    }),
    __param(0, (0, common_1.Param)('sessionId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SessionController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)(':sessionId/start'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Start a session and initialize WhatsApp connection',
    }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Session started',
        type: dto_1.SessionResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Session already started or already starting, or this node is at its MAX_CONCURRENT_SESSIONS cap ' +
            '(`Maximum concurrent sessions reached (N)`), answered only after the 404 and the 409 for a ' +
            'session running on another node; a start refused at the cap launches nothing and leaves a ' +
            'stop in place.',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Session not found' }),
    (0, swagger_1.ApiResponse)({
        status: 409,
        description: 'A credential teardown for the same session name is still in flight (e.g. a prior logout ' +
            'that owns destructive cleanup). Retryable — the body carries `code: ' +
            'SESSION_NAME_TEARDOWN_PENDING`; wait for it to settle and retry. No destructive side ' +
            'effect runs before this refusal. Also returned when another node currently holds this ' +
            "session's engine: only the owner may start it, and the claim is refused before any engine " +
            'is launched, so no second connection to the account is opened. Also returned, with no `code`, ' +
            'when a stop, a logout or force-kill that found a running engine, or a data import (`stopOrphans`) ' +
            'of this session began or finished while the start was waiting, or a delete of it was still ' +
            'running: the start yields and launches nothing. After a stop or force-kill, a new POST /start ' +
            'clears it and starts the session; after a delete, or an import that removed the session, the ' +
            'retry answers 404.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: "The gateway is shutting down, or the engine's browser or socket connection died during launch and " +
            'the one automatic retry failed too; no engine is left running, so the start can be retried.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 504,
        description: 'The engine did not finish starting within its timeout (WhatsApp Web or the network unreachable, ' +
            'a stalled browser or resource limit, or, on whatsapp-web.js, an unreachable proxyUrl or the auth ' +
            'timeout); the engine is torn down and the start can be retried.',
    }),
    __param(0, (0, common_1.Param)('sessionId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SessionController.prototype, "start", null);
__decorate([
    (0, common_1.Post)(':sessionId/stop'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Stop a session and disconnect WhatsApp' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Session stopped',
        type: dto_1.SessionResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'The session id is not a UUID' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Session not found' }),
    (0, swagger_1.ApiResponse)({
        status: 409,
        description: "Another node currently holds this session's live engine (multi-node deployments): stopping " +
            'it here would report the session down while the owner keeps running it, so the request is ' +
            'refused. Retry against the owning node, or once its lease has lapsed.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 502,
        description: 'Session was stopped locally, but the engine teardown did not complete (the graceful ' +
            'disconnect and the force-destroy escalation both failed, so the engine process may still ' +
            "be running). Retryable — the body carries `code: 'SESSION_STOP_INCOMPLETE'`; the status " +
            'is settled to `disconnected` and no success audit is written. Retry the stop; restart the ' +
            'node to reap a leaked process.',
    }),
    __param(0, (0, common_1.Param)('sessionId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SessionController.prototype, "stop", null);
__decorate([
    (0, common_1.Post)(':sessionId/logout'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Log out of WhatsApp (unlinks this device) and stop the session',
        description: 'Attempts an engine-native unlink of this companion device, then tears the session down ' +
            'locally. `200` means the engine-native unlink operation completed AND the required local ' +
            'credential cleanup completed — for Baileys a valid companion identity, an acknowledged ' +
            '`remove-companion-device` IQ response, and removal of the on-disk auth dir; for ' +
            'whatsapp-web.js the native `Client.logout()` promise settled. `200` is NOT an independent ' +
            'observation that the handset UI no longer shows the linked device. Because a completed ' +
            'unlink wipes the stored credentials, reconnecting after a `200` always requires a fresh QR ' +
            'scan or pairing code.',
    }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Unlink operation and required local cleanup completed; session is stopped and `phone` is ' +
            'cleared. Recorded in the audit log as `session_logged_out`.',
        content: {
            'application/json': {
                schema: { $ref: '#/components/schemas/SessionResponseDto' },
                example: {
                    id: '8f3c2b1a-9d4e-4c7a-8b2f-1e6d5a4c3b2a',
                    name: 'my-bot',
                    status: 'disconnected',
                    phone: null,
                    pushName: 'John Doe',
                    connectedAt: '2026-06-24T08:15:00.000Z',
                    lastActive: '2026-06-25T09:01:55.000Z',
                    createdAt: '2026-06-20T11:30:00.000Z',
                    updatedAt: '2026-06-25T09:11:00.000Z',
                    lastError: null,
                    restriction: null,
                    engineLoaded: false,
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Session is not started (no engine to send through); the row is left untouched',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Session not found' }),
    (0, swagger_1.ApiResponse)({
        status: 409,
        description: 'Baileys: the session has no linked WhatsApp device (it never linked, its pairing code was never ' +
            'entered, or the phone removed the link), so there is nothing to unlink. It was stopped locally and ' +
            '`phone` is cleared; no success audit is written. Start it to link a device, or delete it, instead of ' +
            'retrying the logout.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 502,
        description: 'Session was stopped locally, but the logout operation is incomplete (no send, no ' +
            'acknowledgement, timeout/transport error, or local-cleanup failure). Retryable — the ' +
            "body carries `code: 'SESSION_LOGOUT_INCOMPLETE'`; `phone` is cleared and no success audit " +
            'is written. Start the session again and retry the logout.',
    }),
    __param(0, (0, common_1.Param)('sessionId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SessionController.prototype, "logout", null);
__decorate([
    (0, common_1.Post)(':sessionId/force-kill'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Force-kill a stuck session (SIGKILL its wedged engine, then tear it down)' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Session force-killed',
        type: dto_1.SessionResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Session is not started' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Session not found' }),
    (0, swagger_1.ApiResponse)({
        status: 502,
        description: 'Session was stopped locally, but the engine force-kill did not complete (the force-destroy ' +
            'threw or timed out, so the engine process may still be running). The body carries ' +
            "`code: 'SESSION_FORCE_KILL_INCOMPLETE'`; the status is settled to `disconnected` and no " +
            'success audit is written. Restart the node to reap a leaked process.',
    }),
    __param(0, (0, common_1.Param)('sessionId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SessionController.prototype, "forceKill", null);
__decorate([
    (0, common_1.Get)(':sessionId/qr'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Get QR code for session authentication' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'QR code data',
        type: dto_1.QRCodeResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'QR code not ready or session already authenticated',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Session not found' }),
    __param(0, (0, common_1.Param)('sessionId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SessionController.prototype, "getQRCode", null);
__decorate([
    (0, common_1.Post)(':sessionId/pairing-code'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({
        summary: 'Request an 8-char pairing code to link via phone number (alternative to QR)',
        description: 'On the whatsapp-web.js engine, only request a code for a number you are prepared to re-link. A request ' +
            'for a number that already has a linked session has been observed to end with WhatsApp revoking that ' +
            'device: the linked session logs out, its credentials are deleted and it falls back to `qr_ready`. ' +
            'On that engine a number that is the stored phone of another session of this gateway (the Brazilian, ' +
            'Mexican and Argentine mobile spellings of one number count as the same) is refused with `409` and WhatsApp ' +
            'is not asked; the gateway cannot see a link made on another gateway or only on the phone. ' +
            'Baileys was not affected in the same tests and accepts the request: its sessions are companion devices ' +
            'and may share a number. Link by QR when a session of that number must stay up.',
    }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Pairing code generated', type: dto_1.PairingCodeResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Session not started or already authenticated' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Session not found' }),
    (0, swagger_1.ApiResponse)({
        status: 409,
        description: engine_status_responses_1.PAIRING_NOT_READY_409 +
            ' On whatsapp-web.js also answered, with nothing sent to WhatsApp, when the requested number is the stored ' +
            'phone of another session of this gateway: delete that session, or log it out while it runs, first.',
    }),
    (0, swagger_1.ApiResponse)({ status: 503, description: engine_status_responses_1.PAIRING_TRANSPORT_503 }),
    __param(0, (0, common_1.Param)('sessionId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.RequestPairingCodeDto]),
    __metadata("design:returntype", Promise)
], SessionController.prototype, "requestPairingCode", null);
__decorate([
    (0, auth_decorators_1.ChatScoped)('filtered'),
    (0, common_1.Get)(':sessionId/groups'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all groups for a session' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'List of groups the session is a member of',
        type: [dto_1.SessionGroupSummaryDto],
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Session not ready' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Session not found' }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'WhatsApp did not answer the group-list query. Deliberately not reported as an empty list — ' +
            'the engine returns the same empty value for "you are in no groups", and a caller cannot tell ' +
            'those apart from the body. On Baileys, also answered when WhatsApp rate-limits or times out the ' +
            'request (code 429 or 408); retry after a pause.',
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    (0, swagger_1.ApiQuery)({
        name: 'limit',
        required: false,
        type: 'integer',
        description: 'Max groups to return (1-1000, default 1000)',
    }),
    (0, swagger_1.ApiQuery)({ name: 'offset', required: false, type: 'integer', description: 'Number of groups to skip (for paging)' }),
    __param(0, (0, common_1.Param)('sessionId', common_1.ParseUUIDPipe)),
    __param(1, (0, auth_decorators_1.CurrentApiKey)()),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, api_key_entity_1.ApiKey, String, String]),
    __metadata("design:returntype", Promise)
], SessionController.prototype, "getGroups", null);
__decorate([
    (0, auth_decorators_1.ChatScoped)('filtered'),
    (0, common_1.Get)(':sessionId/chats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get active chats for a session' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of active chats (most recent first)', type: [dto_1.ChatSummaryDto] }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Session not ready' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Session not found' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'The whatsapp-web.js page connection died mid-read, or WhatsApp Web did not answer within the ' +
            'protocol timeout, so nothing could be read. Deliberately not reported as an empty list: a page ' +
            'that went away says nothing about the chats.',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'limit',
        required: false,
        type: 'integer',
        description: 'Max chats to return (1-1000, default 1000)',
    }),
    (0, swagger_1.ApiQuery)({ name: 'offset', required: false, type: 'integer', description: 'Number of chats to skip (for paging)' }),
    __param(0, (0, common_1.Param)('sessionId', common_1.ParseUUIDPipe)),
    __param(1, (0, auth_decorators_1.CurrentApiKey)()),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, api_key_entity_1.ApiKey, String, String]),
    __metadata("design:returntype", Promise)
], SessionController.prototype, "getChats", null);
__decorate([
    (0, auth_decorators_1.ChatScoped)('fenced'),
    (0, common_1.Post)(':sessionId/chats/read'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Mark a chat as read/seen' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Returns `{ success }`. `false` means the engine declined to act: the Baileys engine sends the ' +
            'read receipt against the newest message the chat received that it holds in memory, else the ' +
            'newest received one the gateway stored, so a chat with neither (one holding only the ' +
            "account's own sends included) is reported as declined rather than marked read. The " +
            'whatsapp-web.js engine reads the chat from the page and needs no local history.',
        type: dto_1.SessionActionResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Session not ready' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Session not found' }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'WhatsApp did not answer within the request budget. The change may or may not have been applied — ' +
            'the gateway stopped waiting for a confirmation that never came.',
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    __param(0, (0, common_1.Param)('sessionId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.MarkChatReadDto]),
    __metadata("design:returntype", Promise)
], SessionController.prototype, "markChatRead", null);
__decorate([
    (0, auth_decorators_1.ChatScoped)('fenced'),
    (0, common_1.Post)(':sessionId/presence/subscribe'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: "Subscribe to a chat's presence",
        description: 'Asks WhatsApp to start reporting who is online or typing in this chat. Updates arrive as the ' +
            '`presence.update` webhook and socket event — there is no synchronous answer, because presence ' +
            'cannot be queried from either engine, only received.\n\n' +
            'The subscription belongs to the connection: it does **not** survive a restart or an automatic ' +
            'reconnect, and must be re-issued. Subscribe per chat rather than to everything — WhatsApp emits ' +
            'an update on every transition, so a broad subscription is a firehose.\n\n' +
            'whatsapp-web.js cannot do this at all (it exposes no presence subscribe and emits no presence ' +
            'event) and answers `501`.',
    }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Subscribed; updates now arrive as presence.update events',
        type: dto_1.SessionActionResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Session not started' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Session not found' }),
    (0, swagger_1.ApiResponse)({ status: 501, description: 'The active engine cannot observe presence (whatsapp-web.js)' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    (0, swagger_1.ApiResponse)({ status: 503, description: engine_status_responses_1.RECIPIENT_LOOKUP_503 }),
    __param(0, (0, common_1.Param)('sessionId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.SubscribePresenceDto]),
    __metadata("design:returntype", Promise)
], SessionController.prototype, "subscribeToPresence", null);
__decorate([
    (0, common_1.Put)(':sessionId/presence'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({
        summary: "Set the account's own global presence (appear online or offline)",
        description: 'Publishes whether this account appears online. WhatsApp routes notifications away from the ' +
            'phone while a linked device announces itself online, so a headless bot that never goes ' +
            "offline suppresses the phone's own alerts — set `available: false` to hand them back.\n\n" +
            'A successful call is remembered for the life of the running engine and re-applied once each ' +
            'time that connection opens, including a Baileys transient reconnect: the socket announces ' +
            'itself on connect (`available` unless `BAILEYS_MARK_ONLINE_ON_CONNECT=false`), which would ' +
            "otherwise replace the caller's choice. The preference is dropped whenever the gateway replaces " +
            'the engine: stop, restart, reconnect recovery, a watchdog recycle, or a takeover by another ' +
            'node. Re-issue it after `session.status` reports `ready` again. On Baileys, typing, recording ' +
            'and outbound sends do not publish global presence.\n\n' +
            'On Baileys the call fails with 409 when the account push name has not synced yet — the ' +
            'library would otherwise accept the request and send nothing. Supported on both engines.',
    }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Presence published', type: dto_1.SessionActionResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Session not started, or validation failed' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Session not found' }),
    (0, swagger_1.ApiResponse)({
        status: 409,
        description: engine_status_responses_1.ENGINE_NOT_READY_409 +
            ' On Baileys this route also answers `409` for a `ready` session whose account push name has ' +
            'not synced yet. Nothing was sent, and a retry succeeds only once the name has synced.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'The whatsapp-web.js page connection died, or WhatsApp Web did not answer within the protocol ' +
            'timeout. Nothing was confirmed; setting presence converges when repeated, so a retry is safe.',
    }),
    __param(0, (0, common_1.Param)('sessionId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.SetOwnPresenceDto]),
    __metadata("design:returntype", Promise)
], SessionController.prototype, "setOnlinePresence", null);
__decorate([
    (0, auth_decorators_1.ChatScoped)('fenced'),
    (0, common_1.Get)(':sessionId/presence/:chatId'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.VIEWER),
    (0, swagger_1.ApiOperation)({
        summary: "Read a chat's last reported presence",
        description: 'Serves the most recent report received since the chat was subscribed. Returns `null` when ' +
            'nothing has been reported — either the chat was never subscribed, or nothing has changed ' +
            'since. That is a normal state, not a missing resource, so it is `200` with a null body rather ' +
            'than a `404`.\n\n' +
            'Held in memory and never persisted: presence is short-lived, and answering "typing" from ' +
            'before a restart would be worse than answering nothing.',
    }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiParam)({ name: 'chatId', description: 'Chat ID as subscribed' }),
    (0, swagger_1.ApiExtraModels)(dto_1.ChatPresenceResponseDto),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Last reported presence, or null',
        schema: { nullable: true, allOf: [{ $ref: (0, swagger_1.getSchemaPath)(dto_1.ChatPresenceResponseDto) }] },
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'The session id is not a UUID' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Session not found' }),
    __param(0, (0, common_1.Param)('sessionId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('chatId')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], SessionController.prototype, "getPresence", null);
__decorate([
    (0, auth_decorators_1.ChatScoped)('fenced'),
    (0, common_1.Post)(':sessionId/chats/unread'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Mark a chat as unread' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Returns `{ success }`. `false` means the engine declined to act. The Baileys engine keys the mark ' +
            "to the chat's newest message in memory, else the newest stored one, else sends it without one for a " +
            'chat the session knows; an id it knows no chat for answers `false`, and so does an archived chat ' +
            'with no known message, which the phone leaves unmarked without one.',
        type: dto_1.SessionActionResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Session not ready' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Session not found' }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'WhatsApp did not answer within the request budget. The change may or may not have been applied — ' +
            'the gateway stopped waiting for a confirmation that never came.',
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    __param(0, (0, common_1.Param)('sessionId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.MarkChatUnreadDto]),
    __metadata("design:returntype", Promise)
], SessionController.prototype, "markChatUnread", null);
__decorate([
    (0, auth_decorators_1.ChatScoped)('fenced'),
    (0, common_1.Delete)(':sessionId/chats/:chatId/messages'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Delete every message in a chat, keeping the chat itself',
        description: "On success the gateway also removes its stored copies of the chat's messages (rows, inline and archived " +
            'media, search entries) and emits `message:deleted` for each. Changes made on the phone are not mirrored.',
    }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiParam)({ name: 'chatId', description: "Chat JID, e.g. 1234567890-123@g.us (URL-encode the '@')" }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Returns `{ success }`. `false` means the engine declined to act — an unknown chat, or on the ' +
            'Baileys engine a chat with no message in memory or stored, since the clear is keyed to its ' +
            'last message.',
        type: dto_1.SessionActionResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Session not ready' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Session not found' }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'WhatsApp did not answer within the request budget. The change may or may not have been applied — ' +
            'the gateway stopped waiting for a confirmation that never came.',
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    __param(0, (0, common_1.Param)('sessionId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('chatId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SessionController.prototype, "clearChatMessages", null);
__decorate([
    (0, auth_decorators_1.ChatScoped)('fenced'),
    (0, common_1.Post)(':sessionId/chats/archive'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Archive or unarchive a chat' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Returns `{ success }`. `false` means the engine declined to act. The Baileys engine keys the ' +
            "change to the chat's newest message in memory, else the newest stored one, else sends it " +
            'without one, which WhatsApp applies as well, for a chat the session knows; an id it knows no ' +
            'chat for answers `false`.',
        type: dto_1.SessionActionResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Session not ready' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Session not found' }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'WhatsApp did not answer within the request budget. The change may or may not have been applied — ' +
            'the gateway stopped waiting for a confirmation that never came.',
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    __param(0, (0, common_1.Param)('sessionId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.ArchiveChatDto]),
    __metadata("design:returntype", Promise)
], SessionController.prototype, "archiveChat", null);
__decorate([
    (0, auth_decorators_1.ChatScoped)('fenced'),
    (0, common_1.Post)(':sessionId/chats/mute'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Mute or unmute a chat' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Returns `{ success: true }`. Unlike the archive route there is no declined outcome: the mute ' +
            "change is not keyed to the chat's last message on either engine, so a chat with no known " +
            'history mutes like any other.',
        type: dto_1.SessionActionResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Session not ready, an invalid chatId / muteUntil, or a chatId the whatsapp-web.js engine ' +
            'cannot resolve. The Baileys engine writes the mute without resolving the chat first and ' +
            'answers `success: true` for a chat that does not exist.',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Session not found' }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'WhatsApp did not answer within the request budget. The change may or may not have been applied — ' +
            'the gateway stopped waiting for a confirmation that never came.',
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    __param(0, (0, common_1.Param)('sessionId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.MuteChatDto]),
    __metadata("design:returntype", Promise)
], SessionController.prototype, "muteChat", null);
__decorate([
    (0, auth_decorators_1.ChatScoped)('fenced'),
    (0, common_1.Post)(':sessionId/chats/pin'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Pin or unpin a chat at the top of the chat list' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Returns `{ success }`. `false` means the engine declined, and only a pin can: WhatsApp allows ' +
            'at most three pinned chats and the whatsapp-web.js engine reports the refusal. Unpinning always ' +
            'succeeds, and the Baileys engine always reports success because it cannot observe the cap.',
        type: dto_1.SessionActionResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Session not ready, or a chatId the session cannot resolve. An unknown chat is reported here ' +
            'rather than as `success: false`, which on this route means only that the three-pin cap ' +
            'refused a real chat. The Baileys engine cannot resolve chats ahead of the write and answers ' +
            '`success: true` for an unknown chat.',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Session not found' }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'WhatsApp did not answer within the request budget. The change may or may not have been applied — ' +
            'the gateway stopped waiting for a confirmation that never came.',
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    __param(0, (0, common_1.Param)('sessionId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.PinChatDto]),
    __metadata("design:returntype", Promise)
], SessionController.prototype, "pinChat", null);
__decorate([
    (0, auth_decorators_1.ChatScoped)('fenced'),
    (0, common_1.Post)(':sessionId/chats/delete'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Delete a chat from the chat list (e.g. a group you have left)',
        description: "On success the gateway also removes its stored copies of the chat's messages (rows, inline and archived " +
            'media, search entries) and emits `message:deleted` for each. Changes made on the phone are not mirrored.',
    }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Returns `{ success }`. `false` means the engine declined to act: an unknown chat, or on the ' +
            'Baileys engine a chat with no message in memory or stored, since the delete is keyed to its ' +
            'last message.',
        type: dto_1.SessionActionResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Session not ready' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Session not found' }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'WhatsApp did not answer within the request budget. The change may or may not have been applied — ' +
            'the gateway stopped waiting for a confirmation that never came.',
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    __param(0, (0, common_1.Param)('sessionId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.DeleteChatDto]),
    __metadata("design:returntype", Promise)
], SessionController.prototype, "deleteChat", null);
__decorate([
    (0, auth_decorators_1.ChatScoped)('fenced'),
    (0, common_1.Post)(':sessionId/chats/typing'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: "Send a typing/recording presence indicator to a chat (or clear it with 'paused')" }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Presence sent', type: dto_1.SessionActionResponseDto }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Session is not started, or validation failed (an empty chatId, a state other than typing, ' +
            'recording or paused, or a body field the DTO does not declare).',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Session not found' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    __param(0, (0, common_1.Param)('sessionId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.SendChatStateDto]),
    __metadata("design:returntype", Promise)
], SessionController.prototype, "sendChatState", null);
__decorate([
    (0, common_1.Get)('stats/overview'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get session statistics for multi-session monitoring',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Session statistics including counts and memory usage',
        type: dto_1.SessionsOverviewResponseDto,
    }),
    __param(0, (0, auth_decorators_1.CurrentApiKey)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [api_key_entity_1.ApiKey]),
    __metadata("design:returntype", Promise)
], SessionController.prototype, "getStats", null);
exports.SessionController = SessionController = __decorate([
    (0, swagger_1.ApiTags)('sessions'),
    (0, common_1.Controller)('sessions'),
    (0, auth_decorators_1.SessionScoped)(),
    __metadata("design:paramtypes", [session_service_1.SessionService,
        audit_service_1.AuditService,
        chat_scope_service_1.ChatScopeService])
], SessionController);
//# sourceMappingURL=session.controller.js.map