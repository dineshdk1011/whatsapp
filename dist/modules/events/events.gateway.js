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
var EventsGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsGateway = exports.WS_MAX_FRAME_BYTES = exports.QR_DENIED_ROOM = void 0;
exports.isSessionSubscriptionAllowed = isSessionSubscriptionAllowed;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const logger_service_1 = require("../../common/services/logger.service");
const request_context_1 = require("../../common/services/request-context");
const config_1 = require("@nestjs/config");
const auth_service_1 = require("../auth/auth.service");
const chat_scope_service_1 = require("../auth/chat-scope.service");
const redis_io_adapter_1 = require("./redis-io.adapter");
const audit_service_1 = require("../audit/audit.service");
const audit_log_entity_1 = require("../audit/entities/audit-log.entity");
const bootstrap_security_1 = require("../../config/bootstrap-security");
const ip_1 = require("../../common/utils/ip");
const inline_media_1 = require("../../common/utils/inline-media");
const path_safety_1 = require("../../common/utils/path-safety");
const api_key_entity_1 = require("../auth/entities/api-key.entity");
const api_key_authorization_1 = require("../auth/api-key-authorization");
const ws_rate_limit_1 = require("./ws-rate-limit");
function resolveWsCorsOrigin() {
    const policy = (0, bootstrap_security_1.resolveCorsPolicy)(process.env.CORS_ORIGINS, process.env.NODE_ENV);
    return policy.allowAnyOrigin ? true : policy.origins;
}
function readTrustedProxies() {
    return (0, ip_1.parseTrustedProxies)(process.env.TRUSTED_PROXIES);
}
const ws_messages_dto_1 = require("./dto/ws-messages.dto");
const wildcard_events_1 = require("../../common/utils/wildcard-events");
const CHAT_EVENTS = new Set([
    'message.received',
    'message.sent',
    'message.ack',
    'message.receipt',
    'message.revoked',
    'message.reaction',
    'message.edited',
    'group.join',
    'group.leave',
    'group.update',
    'presence.update',
    'event.response',
    'poll.vote',
]);
function withSafeRequestId(message) {
    if (typeof message !== 'object' || message === null || Array.isArray(message))
        return message;
    const { requestId } = message;
    if (requestId === undefined)
        return message;
    if (typeof requestId === 'string' && requestId.length <= MAX_REQUEST_ID_LENGTH)
        return message;
    return { ...message, requestId: undefined };
}
function chatRoom(sessionId, event, chatId) {
    return `${(0, ws_messages_dto_1.buildRoomName)(sessionId, event)}:chat:${encodeURIComponent(chatId)}`;
}
function isSessionSubscriptionAllowed(allowedSessions, sessionId) {
    if (!allowedSessions || allowedSessions.length === 0) {
        return true;
    }
    if (sessionId === '*') {
        return false;
    }
    return allowedSessions.includes(sessionId);
}
exports.QR_DENIED_ROOM = 'role:qr-denied';
const QR_ALLOWED_ROLES = new Set([api_key_entity_1.ApiKeyRole.OPERATOR, api_key_entity_1.ApiKeyRole.ADMIN]);
const MAX_SUBSCRIBE_SESSION_ID_LENGTH = 128;
const MAX_REQUEST_ID_LENGTH = 128;
const MAX_ROOMS_PER_SOCKET = 4096;
const TOO_MANY_SUBSCRIPTIONS_MESSAGE = `A connection may hold at most ${MAX_ROOMS_PER_SOCKET} subscriptions; unsubscribe first`;
function isSessionSelector(sessionId) {
    return sessionId === '*' || (sessionId.length <= MAX_SUBSCRIBE_SESSION_ID_LENGTH && (0, path_safety_1.isSafeSessionName)(sessionId));
}
function isKeyRefusal(error) {
    return error instanceof common_1.UnauthorizedException || error instanceof common_1.ForbiddenException;
}
const KEY_UNREADABLE_MESSAGE = 'The API key could not be checked; retry shortly';
const EVICTION_MESSAGES = {
    revoked: 'API key has been revoked',
    deleted: 'API key has been deleted',
    authorization_changed: 'API key authorization changed; please reconnect',
    expired: 'API key has expired',
};
exports.WS_MAX_FRAME_BYTES = 8 * 1024;
let EventsGateway = class EventsGateway {
    static { EventsGateway_1 = this; }
    authService;
    auditService;
    configService;
    chatScope;
    server;
    logger = (0, logger_service_1.createLogger)('EventsGateway');
    socketsByKeyId = new Map();
    chatDeliveries = new Map();
    pendingSubscriptions = new WeakMap();
    authzSweepTimer;
    rateLimits;
    frameLimiter;
    handshakeLimiter;
    violations = new Map();
    static VIOLATION_AUDIT_WINDOW_MS = 60_000;
    static MAX_VIOLATION_KEYS = 10_000;
    constructor(authService, auditService, configService, chatScope = new chat_scope_service_1.ChatScopeService()) {
        this.authService = authService;
        this.auditService = auditService;
        this.configService = configService;
        this.chatScope = chatScope;
        this.rateLimits = (0, ws_rate_limit_1.readWsRateLimitConfig)();
        this.frameLimiter = new ws_rate_limit_1.TokenBucketLimiter(this.rateLimits.framePerSecond, this.rateLimits.frameBurst);
        this.handshakeLimiter = new ws_rate_limit_1.SlidingWindowLimiter(this.rateLimits.handshakeMax, this.rateLimits.handshakeWindowMs);
    }
    afterInit() {
        this.logger.log('WebSocket Gateway initialized');
        this.authzSweepTimer = setInterval(() => {
            void this.sweepApiKeyAuthorization().catch(error => this.logger.error('Failed to sweep WebSocket API key authorization', error instanceof Error ? error.stack : error));
        }, 60_000);
        this.authzSweepTimer.unref?.();
    }
    onModuleDestroy() {
        if (this.authzSweepTimer)
            clearInterval(this.authzSweepTimer);
        this.authzSweepTimer = undefined;
    }
    async sweepApiKeyAuthorization(now = Date.now()) {
        for (const [keyId, sockets] of Array.from(this.socketsByKeyId.entries())) {
            if (Array.from(sockets).some(client => this.isSnapshotExpired(client, now))) {
                this.evictApiKey(keyId, 'expired');
            }
        }
        const keyIds = Array.from(this.socketsByKeyId.keys());
        if (keyIds.length === 0)
            return;
        const current = await this.authService.findAuthorizationStates(keyIds);
        const byId = new Map(current.map(key => [key.id, key]));
        for (const keyId of keyIds) {
            const reason = this.evictionReason(byId.get(keyId), this.socketsByKeyId.get(keyId), now);
            if (reason)
                this.evictApiKey(keyId, reason);
        }
    }
    evictionReason(current, sockets, now) {
        if (!sockets || sockets.size === 0)
            return null;
        if (!current)
            return 'deleted';
        if (!current.isActive)
            return 'revoked';
        const expiry = (0, api_key_authorization_1.apiKeyExpiryTime)(current.expiresAt);
        if (expiry !== null && expiry <= now)
            return 'expired';
        const authorization = (0, api_key_authorization_1.apiKeyAuthorizationFingerprint)(current);
        const stale = Array.from(sockets).some(client => this.snapshotFingerprint(client) !== authorization || this.hasDivergentGrant(client));
        return stale ? 'authorization_changed' : null;
    }
    snapshotFingerprint(client) {
        const snapshot = client.data?.apiKey;
        return snapshot ? (0, api_key_authorization_1.apiKeyAuthorizationFingerprint)(snapshot) : '';
    }
    isSnapshotExpired(client, now) {
        const snapshot = client.data?.apiKey;
        const expiry = (0, api_key_authorization_1.apiKeyExpiryTime)(snapshot?.expiresAt);
        return expiry !== null && expiry <= now;
    }
    hasDivergentGrant(client) {
        return client.data?.authorizationDiverged === true;
    }
    resolveClientIp(client) {
        const handshake = client.handshake;
        const req = {
            ip: handshake.address,
            socket: { remoteAddress: handshake.address },
            headers: handshake.headers ?? {},
        };
        return (0, ip_1.resolveClientIp)(req, readTrustedProxies());
    }
    trackSocket(keyId, client) {
        let sockets = this.socketsByKeyId.get(keyId);
        if (!sockets) {
            sockets = new Set();
            this.socketsByKeyId.set(keyId, sockets);
        }
        sockets.add(client);
    }
    untrackSocket(client) {
        const keyId = client.data?.apiKey?.id;
        if (!keyId)
            return;
        const sockets = this.socketsByKeyId.get(keyId);
        if (!sockets)
            return;
        sockets.delete(client);
        if (sockets.size === 0) {
            this.socketsByKeyId.delete(keyId);
        }
    }
    evictApiKey(keyId, reason = 'revoked') {
        const sockets = this.socketsByKeyId.get(keyId);
        if (!sockets || sockets.size === 0)
            return;
        this.logger.log(`Evicting ${sockets.size} WebSocket connection(s) (${reason}) for key ${keyId}`);
        this.socketsByKeyId.delete(keyId);
        const message = EVICTION_MESSAGES[reason];
        for (const client of sockets) {
            client.emit('message', this.createError('UNAUTHORIZED', message));
            client.disconnect(true);
        }
    }
    handleConnection(client) {
        const ready = this.authenticate(client);
        client.data.authReady = ready;
        return ready;
    }
    async authenticate(client) {
        const clientIp = this.resolveClientIp(client);
        const handshakeKey = (0, ip_1.limiterKeyForIp)(clientIp);
        const handshakeReservation = {};
        if (!this.handshakeLimiter.allow(handshakeKey, handshakeReservation)) {
            this.logger.warn(`Client ${client.id} rejected: handshake rate limit exceeded (ip: ${clientIp})`);
            this.noteRateLimitViolation('handshake', { ipAddress: clientIp });
            client.emit('message', this.createError('RATE_LIMITED', 'Too many connection attempts, retry later'));
            client.disconnect(true);
            return;
        }
        const handshakeAuth = client.handshake.auth;
        const authKey = typeof handshakeAuth?.apiKey === 'string' ? handshakeAuth.apiKey : undefined;
        const apiKey = authKey || client.handshake.headers['x-api-key'];
        if (!apiKey) {
            this.logger.warn(`Client ${client.id} rejected: No API key provided`);
            void this.auditService.logWarn(audit_log_entity_1.AuditAction.API_KEY_AUTH_FAILED, {
                ipAddress: clientIp,
                metadata: { surface: 'websocket' },
                errorMessage: 'missing API key',
            });
            client.emit('message', this.createError('UNAUTHORIZED', 'API key required'));
            client.disconnect(true);
            return;
        }
        let refusedKey;
        try {
            const validKey = await (0, request_context_1.runWithRequestId)((0, crypto_1.randomUUID)(), () => this.authService.validateApiKey(apiKey, clientIp).catch((error) => {
                const actor = (0, request_context_1.getRequestActor)();
                if (actor?.apiKeyId)
                    refusedKey = { id: actor.apiKeyId, name: actor.apiKeyName ?? '' };
                throw error;
            }));
            const existing = this.socketsByKeyId.get(validKey.id);
            if (existing && existing.size >= this.rateLimits.maxSocketsPerKey) {
                this.logger.warn(`Client ${client.id} rejected: socket cap reached for key ${validKey.id} (${this.rateLimits.maxSocketsPerKey})`);
                this.noteRateLimitViolation('sockets', { apiKeyId: validKey.id, ipAddress: clientIp });
                client.emit('message', this.createError('RATE_LIMITED', `Too many concurrent connections for this API key (max ${this.rateLimits.maxSocketsPerKey})`));
                client.disconnect(true);
                return;
            }
            client.data.apiKey = validKey;
            client.data.rawApiKey = apiKey;
            this.trackSocket(validKey.id, client);
            this.handshakeLimiter.refund(handshakeKey, handshakeReservation);
            if (client.disconnected) {
                this.untrackSocket(client);
                this.logger.log(`Client ${client.id} authenticated after it had already gone (key: ${validKey.name})`);
                return;
            }
            this.logger.log(`Client connected: ${client.id} (key: ${validKey.name})`);
        }
        catch (error) {
            if (!isKeyRefusal(error)) {
                this.logger.error(`Client ${client.id} rejected: API key could not be checked`, error instanceof Error ? error.stack : String(error));
                client.emit('message', this.createError('INTERNAL_ERROR', KEY_UNREADABLE_MESSAGE));
                client.disconnect(true);
                return;
            }
            this.logger.warn(`Client ${client.id} rejected: Auth error`, {
                error: error instanceof Error ? error.message : String(error),
            });
            void this.auditService.logWarn(audit_log_entity_1.AuditAction.API_KEY_AUTH_FAILED, {
                apiKey: refusedKey,
                ipAddress: clientIp,
                metadata: { surface: 'websocket' },
                errorMessage: error instanceof Error ? error.message : String(error),
            });
            client.emit('message', this.createError('UNAUTHORIZED', 'Authentication failed'));
            client.disconnect(true);
        }
    }
    auditAuthorizationRefusal(apiKey, clientIp, message) {
        void this.auditService.logWarn(audit_log_entity_1.AuditAction.API_KEY_AUTH_FAILED, {
            apiKey,
            ipAddress: clientIp,
            metadata: { surface: 'websocket' },
            errorMessage: message,
        });
    }
    handleDisconnect(client) {
        this.untrackSocket(client);
        this.logger.log(`Client disconnected: ${client.id}`);
    }
    reply(client, frame) {
        if (!client.disconnected) {
            client.emit('message', frame);
        }
        return frame;
    }
    async handleMessage(client, incoming) {
        const message = withSafeRequestId(incoming);
        const frameSubject = client.data?.apiKey?.id ??
            (0, ip_1.limiterKeyForIp)(this.resolveClientIp(client));
        if (!this.frameLimiter.allow(frameSubject)) {
            const requestId = message?.requestId;
            this.noteRateLimitViolation('frame', {
                apiKeyId: client.data?.apiKey?.id,
                ipAddress: this.resolveClientIp(client),
            });
            return this.reply(client, this.createError('RATE_LIMITED', 'Frame rate limit exceeded, slow down', requestId));
        }
        await client.data.authReady;
        if (client.disconnected) {
            return undefined;
        }
        switch (message?.type) {
            case 'subscribe':
                return this.reply(client, await this.handleSubscribe(client, message));
            case 'unsubscribe':
                return this.reply(client, this.handleUnsubscribe(client, message));
            case 'ping':
                return this.reply(client, this.handlePing(client, message.requestId));
            default:
                return this.reply(client, this.createError('INVALID_MESSAGE', `Unknown message type`, message?.requestId));
        }
    }
    async handleSubscribe(client, message) {
        const { sessionId, events, requestId } = message;
        if (!sessionId || typeof sessionId !== 'string') {
            return this.createError('INVALID_SESSION', 'sessionId is required', requestId);
        }
        if (!isSessionSelector(sessionId)) {
            return this.createError('INVALID_SESSION', 'sessionId must be "*" or a session id', requestId);
        }
        const rawApiKey = client.data.rawApiKey;
        const clientIp = this.resolveClientIp(client);
        const subscription = { sessionId, cancelled: false };
        let pending = this.pendingSubscriptions.get(client);
        if (!pending) {
            pending = new Set();
            this.pendingSubscriptions.set(client, pending);
        }
        pending.add(subscription);
        let subscriberKey;
        let unreadable = false;
        try {
            subscriberKey = rawApiKey ? await this.authService.validateApiKey(rawApiKey, clientIp) : null;
        }
        catch (error) {
            subscriberKey = null;
            if (isKeyRefusal(error)) {
                void this.auditService.logWarn(audit_log_entity_1.AuditAction.API_KEY_AUTH_FAILED, {
                    apiKey: client.data.apiKey,
                    ipAddress: clientIp,
                    metadata: { surface: 'websocket' },
                    errorMessage: error instanceof Error ? error.message : String(error),
                });
            }
            else {
                unreadable = true;
                this.logger.error(`Subscribe from ${client.id} failed: API key could not be checked`, error instanceof Error ? error.stack : String(error));
            }
        }
        finally {
            pending.delete(subscription);
            if (pending.size === 0)
                this.pendingSubscriptions.delete(client);
        }
        if (unreadable) {
            return this.createError('INTERNAL_ERROR', KEY_UNREADABLE_MESSAGE, requestId);
        }
        if (!subscriberKey) {
            client.emit('message', this.createError('UNAUTHORIZED', 'API key is no longer valid', requestId));
            client.disconnect(true);
            return this.createError('UNAUTHORIZED', 'API key is no longer valid', requestId);
        }
        if (client.disconnected) {
            return this.createError('UNAUTHORIZED', 'Connection is closed', requestId);
        }
        const snapshot = client.data.apiKey;
        const chatRestricted = this.chatScope.isRestricted(subscriberKey);
        if ((chatRestricted || this.chatScope.isRestricted(snapshot)) &&
            (0, api_key_authorization_1.apiKeyAuthorizationFingerprint)(subscriberKey) !== this.snapshotFingerprint(client)) {
            const refusal = this.createError('UNAUTHORIZED', EVICTION_MESSAGES.authorization_changed, requestId);
            this.auditAuthorizationRefusal(subscriberKey, clientIp, refusal.message);
            client.emit('message', refusal);
            client.disconnect(true);
            return refusal;
        }
        if ((0, api_key_authorization_1.apiKeyAuthorizationFingerprint)(subscriberKey) !== this.snapshotFingerprint(client)) {
            client.data.authorizationDiverged = true;
        }
        this.syncQrAccess(client, subscriberKey.role);
        if (!isSessionSubscriptionAllowed(subscriberKey.allowedSessions, sessionId)) {
            return this.createError('FORBIDDEN_SESSION', 'API key is not authorized for this session', requestId);
        }
        if (!events || !Array.isArray(events) || events.length === 0) {
            return this.createError('INVALID_EVENTS', 'events array is required', requestId);
        }
        const validEvents = [
            ...new Set(events.filter(e => e === '*' || ws_messages_dto_1.SUBSCRIBABLE_EVENTS.includes(e))),
        ];
        if (validEvents.length === 0) {
            return this.createError('INVALID_EVENTS', `No valid events. Valid: ${ws_messages_dto_1.SUBSCRIBABLE_EVENTS.join(', ')}, *`, requestId);
        }
        const permittedEvents = chatRestricted
            ? validEvents.filter(event => event === '*' || CHAT_EVENTS.has(event))
            : validEvents;
        if (permittedEvents.length === 0) {
            return this.createError('FORBIDDEN_EVENTS', 'API key may subscribe only to chat events', requestId);
        }
        const chats = chatRestricted ? [...this.chatScope.scopeFor(subscriberKey).allowed] : undefined;
        if (chats && permittedEvents.length * chats.length > MAX_ROOMS_PER_SOCKET) {
            const remedy = chats.length <= MAX_ROOMS_PER_SOCKET ? 'name fewer events or use "*"' : 'shorten the allowlist';
            return this.createError('TOO_MANY_SUBSCRIPTIONS', `This key's chat allowlist makes every event ${chats.length} subscriptions and a connection may hold at most ${MAX_ROOMS_PER_SOCKET}; ${remedy}`, requestId);
        }
        const rooms = permittedEvents.flatMap(event => chats ? chats.map(chatId => chatRoom(sessionId, event, chatId)) : [(0, ws_messages_dto_1.buildRoomName)(sessionId, event)]);
        if (rooms.length === 0) {
            return this.createError('FORBIDDEN_EVENTS', 'API key has no valid chats to subscribe to', requestId);
        }
        const held = [...client.rooms].filter(room => room.startsWith('session:')).length;
        const newRooms = rooms.filter(room => !client.rooms.has(room)).length;
        if (held + newRooms > MAX_ROOMS_PER_SOCKET) {
            return this.createError('TOO_MANY_SUBSCRIPTIONS', TOO_MANY_SUBSCRIPTIONS_MESSAGE, requestId);
        }
        if (subscription.cancelled) {
            return this.createError('SUBSCRIPTION_CANCELLED', 'Subscription was cancelled', requestId);
        }
        for (const room of rooms) {
            void client.join(room);
        }
        this.logger.debug(`Client ${client.id} subscribed to: ${rooms.join(', ')}`);
        return {
            type: 'subscribed',
            sessionId,
            events: permittedEvents,
            requestId,
            timestamp: new Date().toISOString(),
        };
    }
    syncQrAccess(client, role) {
        if (role && QR_ALLOWED_ROLES.has(role)) {
            void client.leave(exports.QR_DENIED_ROOM);
        }
        else {
            void client.join(exports.QR_DENIED_ROOM);
        }
    }
    handleUnsubscribe(client, message) {
        const { sessionId, requestId } = message;
        if (!sessionId || typeof sessionId !== 'string') {
            return this.createError('INVALID_SESSION', 'sessionId is required', requestId);
        }
        if (!isSessionSelector(sessionId)) {
            return this.createError('INVALID_SESSION', 'sessionId must be "*" or a session id', requestId);
        }
        for (const subscription of this.pendingSubscriptions.get(client) ?? []) {
            if (sessionId === '*' || subscription.sessionId === sessionId)
                subscription.cancelled = true;
        }
        const clientRooms = Array.from(client.rooms);
        const sessionPrefix = `session:${sessionId}:`;
        for (const room of clientRooms) {
            if (room.startsWith(sessionPrefix) || (sessionId === '*' && room.startsWith('session:'))) {
                void client.leave(room);
            }
        }
        this.logger.debug(`Client ${client.id} unsubscribed from session: ${sessionId}`);
        return {
            type: 'unsubscribed',
            sessionId,
            requestId,
            timestamp: new Date().toISOString(),
        };
    }
    handlePing(_client, requestId) {
        return {
            type: 'pong',
            requestId,
            timestamp: new Date().toISOString(),
        };
    }
    createError(code, message, requestId) {
        return {
            type: 'error',
            code,
            message,
            requestId,
            timestamp: new Date().toISOString(),
        };
    }
    noteRateLimitViolation(kind, subject) {
        const mapKey = `${kind}:${subject.apiKeyId ?? (subject.ipAddress ? (0, ip_1.limiterKeyForIp)(subject.ipAddress) : 'unknown')}`;
        const now = Date.now();
        const prior = this.violations.get(mapKey);
        if (prior && now - prior.since < EventsGateway_1.VIOLATION_AUDIT_WINDOW_MS) {
            prior.count += 1;
            return;
        }
        const suppressed = prior?.count ?? 0;
        this.violations.delete(mapKey);
        this.violations.set(mapKey, { count: 0, since: now });
        while (this.violations.size > EventsGateway_1.MAX_VIOLATION_KEYS) {
            const oldest = this.violations.keys().next().value;
            if (oldest === undefined)
                break;
            this.violations.delete(oldest);
        }
        void this.auditService.logWarn(audit_log_entity_1.AuditAction.RATE_LIMIT_EXCEEDED, {
            apiKey: subject.apiKeyId ? { id: subject.apiKeyId } : undefined,
            ipAddress: subject.ipAddress,
            metadata: { surface: 'websocket', kind, suppressed },
            errorMessage: `websocket ${kind} rate limit exceeded`,
        });
    }
    emitToRooms(sessionId, event, data, exceptRoom) {
        const eventMessage = {
            type: 'event',
            payload: { event, sessionId, data },
            timestamp: new Date().toISOString(),
        };
        const named = this.server.to((0, ws_messages_dto_1.buildRoomName)(sessionId, event)).to((0, ws_messages_dto_1.buildRoomName)('*', event));
        const broadcast = wildcard_events_1.WILDCARD_EXCLUDED_EVENTS.includes(event)
            ? named
            : named.to((0, ws_messages_dto_1.buildRoomName)(sessionId, '*')).to((0, ws_messages_dto_1.buildRoomName)('*', '*'));
        (exceptRoom ? broadcast.except(exceptRoom) : broadcast).emit('message', eventMessage);
        if (!CHAT_EVENTS.has(event) || data === null || typeof data !== 'object')
            return;
        const value = data;
        const chatId = event.startsWith('group.') ? value.groupId : value.chatId;
        if (typeof chatId !== 'string' || !chatId.trim())
            return;
        if (!(0, redis_io_adapter_1.isWsRedisEnabled)() &&
            !Array.from(this.socketsByKeyId.values()).some(sockets => Array.from(sockets).some(client => this.chatScope.isRestricted(client.data.apiKey)))) {
            return;
        }
        const delivery = Promise.allSettled([
            this.chatDeliveries.get(sessionId),
            this.chatScope.idsForFilter({ allowedChats: [chatId] }),
        ])
            .then(([, resolved]) => {
            if (resolved.status === 'rejected')
                throw resolved.reason;
            const ids = resolved.value;
            if (!ids?.length)
                return;
            const rooms = ids.flatMap(id => {
                const namedRooms = [chatRoom(sessionId, event, id), chatRoom('*', event, id)];
                return wildcard_events_1.WILDCARD_EXCLUDED_EVENTS.includes(event)
                    ? namedRooms
                    : [...namedRooms, chatRoom(sessionId, '*', id), chatRoom('*', '*', id)];
            });
            this.server.to(rooms).emit('message', eventMessage);
        })
            .catch(error => this.logger.warn('Could not resolve chat identity for WebSocket delivery', {
            error: error instanceof Error ? error.message : String(error),
        }))
            .finally(() => {
            if (this.chatDeliveries.get(sessionId) === delivery)
                this.chatDeliveries.delete(sessionId);
        });
        this.chatDeliveries.set(sessionId, delivery);
    }
    emitSessionStatus(sessionId, status, data) {
        this.emitToRooms(sessionId, 'session.status', { status, ...data });
    }
    emitSessionAuthenticated(sessionId, data) {
        this.emitToRooms(sessionId, 'session.authenticated', data);
    }
    emitSessionDisconnected(sessionId, data) {
        this.emitToRooms(sessionId, 'session.disconnected', data);
    }
    emitSessionRestriction(sessionId, data) {
        this.emitToRooms(sessionId, 'session.restriction', data);
    }
    emitCallAccepted(sessionId, data) {
        this.emitToRooms(sessionId, 'call.accepted', data);
    }
    emitCallRejected(sessionId, data) {
        this.emitToRooms(sessionId, 'call.rejected', data);
    }
    emitCallMissed(sessionId, data) {
        this.emitToRooms(sessionId, 'call.missed', data);
    }
    emitPresenceUpdate(sessionId, data) {
        this.emitToRooms(sessionId, 'presence.update', data);
    }
    emitEventResponse(sessionId, data) {
        this.emitToRooms(sessionId, 'event.response', data);
    }
    emitPollVote(sessionId, data) {
        this.emitToRooms(sessionId, 'poll.vote', data);
    }
    emitQRCode(sessionId, qrCode) {
        this.emitToRooms(sessionId, 'session.qr', { qrCode }, exports.QR_DENIED_ROOM);
    }
    messageMediaInlineMaxBytes() {
        return this.configService.get('webhook.mediaInlineMaxBytes', inline_media_1.DEFAULT_WEBHOOK_MEDIA_INLINE_MAX_BYTES);
    }
    emitMessage(sessionId, message) {
        this.emitToRooms(sessionId, 'message.received', this.shedMessageMedia(message));
    }
    emitMessageSent(sessionId, message) {
        this.emitToRooms(sessionId, 'message.sent', this.shedMessageMedia(message));
    }
    shedMessageMedia(message) {
        return (0, inline_media_1.shedInlineMedia)(message, this.messageMediaInlineMaxBytes());
    }
    emitMessageAck(sessionId, data) {
        this.emitToRooms(sessionId, 'message.ack', data);
    }
    emitMessageReceipt(sessionId, data) {
        this.emitToRooms(sessionId, 'message.receipt', data);
    }
    emitMessageRevoked(sessionId, message) {
        this.emitToRooms(sessionId, 'message.revoked', message);
    }
    emitMessageReaction(sessionId, data) {
        this.emitToRooms(sessionId, 'message.reaction', data);
    }
    emitMessageEdited(sessionId, data) {
        this.emitToRooms(sessionId, 'message.edited', data);
    }
    emitGroupJoin(sessionId, data) {
        this.emitToRooms(sessionId, 'group.join', data);
    }
    emitGroupLeave(sessionId, data) {
        this.emitToRooms(sessionId, 'group.leave', data);
    }
    emitGroupUpdate(sessionId, data) {
        this.emitToRooms(sessionId, 'group.update', data);
    }
    emitGroupJoinRequest(sessionId, data) {
        this.emitToRooms(sessionId, 'group.join_request', data);
    }
    emitCallReceived(sessionId, data) {
        this.emitToRooms(sessionId, 'call.received', data);
    }
    emitStatusReceived(sessionId, data) {
        this.emitToRooms(sessionId, 'status.received', data);
    }
};
exports.EventsGateway = EventsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], EventsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('message'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], EventsGateway.prototype, "handleMessage", null);
exports.EventsGateway = EventsGateway = EventsGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: resolveWsCorsOrigin(),
        },
        namespace: '/events',
        maxHttpBufferSize: exports.WS_MAX_FRAME_BYTES,
    }),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        audit_service_1.AuditService,
        config_1.ConfigService,
        chat_scope_service_1.ChatScopeService])
], EventsGateway);
//# sourceMappingURL=events.gateway.js.map