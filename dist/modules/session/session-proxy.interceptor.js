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
exports.SessionProxyInterceptor = exports.FORWARDED_HEADER = void 0;
exports.forwardTarget = forwardTarget;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const rxjs_1 = require("rxjs");
const session_entity_1 = require("./entities/session.entity");
const session_ownership_service_1 = require("./session-ownership.service");
const auth_decorators_1 = require("../auth/decorators/auth.decorators");
const logger_service_1 = require("../../common/services/logger.service");
const ip_1 = require("../../common/utils/ip");
const FORWARDED_REQUEST_HEADERS = ['x-api-key', 'authorization', 'accept', 'idempotency-key'];
const RELAYED_RESPONSE_HEADERS = [
    'content-type',
    'content-disposition',
    'x-content-type-options',
    'idempotent-replayed',
    'retry-after',
    'retry-after-short',
    'retry-after-medium',
    'retry-after-long',
    'x-ratelimit-limit-short',
    'x-ratelimit-remaining-short',
    'x-ratelimit-reset-short',
    'x-ratelimit-limit-medium',
    'x-ratelimit-remaining-medium',
    'x-ratelimit-reset-medium',
    'x-ratelimit-limit-long',
    'x-ratelimit-remaining-long',
    'x-ratelimit-reset-long',
];
const NOT_DISPATCHED_CODES = new Set([
    'ECONNREFUSED',
    'ENOTFOUND',
    'EAI_AGAIN',
    'EHOSTUNREACH',
    'ENETUNREACH',
    'UND_ERR_CONNECT_TIMEOUT',
]);
exports.FORWARDED_HEADER = 'x-openwa-forwarded';
function forwardTarget(originalUrl, ownerNodeUrl) {
    const base = new URL(ownerNodeUrl);
    const requested = new URL(originalUrl, base);
    const target = new URL(base.toString());
    target.pathname = base.pathname.replace(/\/$/, '') + requested.pathname;
    target.search = requested.search;
    return target.toString();
}
let SessionProxyInterceptor = class SessionProxyInterceptor {
    reflector;
    sessions;
    ownership;
    configService;
    logger = (0, logger_service_1.createLogger)('SessionProxyInterceptor');
    constructor(reflector, sessions, ownership, configService) {
        this.reflector = reflector;
        this.sessions = sessions;
        this.ownership = ownership;
        this.configService = configService;
    }
    async intercept(context, next) {
        if (context.getType() !== 'http' || !this.ownership)
            return next.handle();
        if (!this.ownership.nodeUrl)
            return next.handle();
        const request = context.switchToHttp().getRequest();
        const sessionId = this.sessionIdOf(context, request);
        if (!sessionId || sessionId.includes('\0'))
            return next.handle();
        const owner = await this.sessions.findOne({
            where: { id: sessionId },
            select: { id: true, nodeId: true, nodeUrl: true, leaseExpiresAt: true },
        });
        if (!owner?.nodeId || owner.nodeId === this.ownership.nodeId)
            return next.handle();
        const leaseLive = owner.leaseExpiresAt != null && owner.leaseExpiresAt > new Date();
        if (!leaseLive)
            return next.handle();
        if (request.headers[exports.FORWARDED_HEADER]) {
            throw new common_1.ConflictException(`Session ${sessionId} is running on another node`);
        }
        if (!owner.nodeUrl)
            return next.handle();
        await this.forward(request, context.switchToHttp().getResponse(), owner.nodeId, owner.nodeUrl);
        return (0, rxjs_1.of)(undefined);
    }
    sessionIdOf(context, request) {
        const params = (request.params ?? {});
        if (params.sessionId)
            return params.sessionId;
        const sessionScoped = this.reflector.getAllAndOverride(auth_decorators_1.SESSION_SCOPED_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        return sessionScoped ? params.id : undefined;
    }
    async forward(request, response, ownerNodeId, ownerNodeUrl) {
        const timeoutMs = this.configService?.get('session.proxyTimeoutMs', 60_000) ?? 60_000;
        const hasBody = !['GET', 'HEAD'].includes(request.method);
        const headers = { [exports.FORWARDED_HEADER]: this.ownership?.nodeId ?? '1' };
        for (const name of FORWARDED_REQUEST_HEADERS) {
            const value = request.headers[name];
            if (typeof value === 'string')
                headers[name] = value;
        }
        if (hasBody)
            headers['content-type'] = 'application/json';
        const inbound = request.headers['x-forwarded-for'];
        const inboundChain = Array.isArray(inbound) ? inbound.join(', ') : inbound;
        const observedPeer = (0, ip_1.normalizeIp)(request.socket?.remoteAddress || request.ip || '');
        if (observedPeer) {
            headers['x-forwarded-for'] = inboundChain ? `${inboundChain}, ${observedPeer}` : observedPeer;
        }
        let target;
        try {
            target = forwardTarget(request.originalUrl, ownerNodeUrl);
            const upstream = await fetch(target, {
                method: request.method,
                headers,
                body: hasBody ? JSON.stringify(request.body ?? {}) : undefined,
                signal: AbortSignal.timeout(timeoutMs),
                redirect: 'manual',
            });
            const body = Buffer.from(await upstream.arrayBuffer());
            response.status(upstream.status);
            for (const name of RELAYED_RESPONSE_HEADERS) {
                const value = upstream.headers.get(name);
                if (value)
                    response.setHeader(name, value);
            }
            response.setHeader('x-openwa-served-by', ownerNodeId);
            if (body.length > 0)
                response.send(body);
            else
                response.end();
        }
        catch (error) {
            const failure = (error ?? {});
            const code = failure.cause?.code;
            this.logger.warn(`Forwarding to session owner '${ownerNodeId}' failed`, {
                ownerNodeUrl,
                error: error instanceof Error ? error.message : String(error),
                cause: code,
            });
            if (target === undefined || (typeof code === 'string' && NOT_DISPATCHED_CODES.has(code))) {
                response.status(503).json({
                    statusCode: 503,
                    message: `this session is hosted on node '${ownerNodeId}', which could not be reached from this node — ` +
                        'check the owner node and its NODE_URL',
                    error: 'Service Unavailable',
                });
                return;
            }
            const timedOut = failure.name === 'TimeoutError' || failure.name === 'AbortError';
            const status = timedOut ? 504 : 502;
            response.status(status).json({
                statusCode: status,
                message: timedOut
                    ? `node '${ownerNodeId}', which hosts this session, did not answer within ${timeoutMs}ms; ` +
                        'the request may still have been carried out there'
                    : `forwarding to node '${ownerNodeId}', which hosts this session, failed, possibly after the request ` +
                        'was sent; it may have been carried out there, check the owner node and its NODE_URL',
                error: timedOut ? 'Gateway Timeout' : 'Bad Gateway',
            });
        }
    }
};
exports.SessionProxyInterceptor = SessionProxyInterceptor;
exports.SessionProxyInterceptor = SessionProxyInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(session_entity_1.Session, 'data')),
    __param(2, (0, common_1.Optional)()),
    __param(3, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [core_1.Reflector,
        typeorm_2.Repository,
        session_ownership_service_1.SessionOwnershipService,
        config_1.ConfigService])
], SessionProxyInterceptor);
//# sourceMappingURL=session-proxy.interceptor.js.map