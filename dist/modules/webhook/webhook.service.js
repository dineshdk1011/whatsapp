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
exports.WebhookService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const config_1 = require("@nestjs/config");
const webhook_entity_1 = require("./entities/webhook.entity");
const webhook_delivery_failure_entity_1 = require("./entities/webhook-delivery-failure.entity");
const session_entity_1 = require("../session/entities/session.entity");
const logger_service_1 = require("../../common/services/logger.service");
const session_scope_1 = require("../../common/security/session-scope");
const paginate_1 = require("../../common/utils/paginate");
const idempotency_util_1 = require("./utils/idempotency.util");
const deliver_once_1 = require("./utils/deliver-once");
const ssrf_guard_1 = require("../../common/security/ssrf-guard");
const webhook_delivery_service_1 = require("./webhook-delivery.service");
const DEFAULT_WEBHOOK_MAX_PER_SESSION = 16;
let WebhookService = class WebhookService {
    webhookRepository;
    failureRepository;
    sessionRepository;
    configService;
    delivery;
    logger = (0, logger_service_1.createLogger)('WebhookService');
    cleanupTimer;
    payloadCleanupTimer;
    constructor(webhookRepository, failureRepository, sessionRepository, configService, delivery) {
        this.webhookRepository = webhookRepository;
        this.failureRepository = failureRepository;
        this.sessionRepository = sessionRepository;
        this.configService = configService;
        this.delivery = delivery;
    }
    onModuleInit() {
        this.schedulePayloadPrune();
        const parsed = Number.parseInt(process.env.WEBHOOK_FAILURE_RETENTION_DAYS ?? '', 10);
        const retentionDays = Number.isInteger(parsed) ? Math.max(0, parsed) : 90;
        if (retentionDays <= 0) {
            this.logger.log('Webhook delivery-failure retention disabled (WEBHOOK_FAILURE_RETENTION_DAYS <= 0)');
            return;
        }
        const runPrune = () => {
            this.pruneDeliveryFailures(retentionDays)
                .then(n => {
                if (n > 0)
                    this.logger.log(`Pruned ${n} webhook delivery-failure(s) older than ${retentionDays} day(s)`);
            })
                .catch(err => this.logger.error('Webhook delivery-failure cleanup failed', err instanceof Error ? err.stack : String(err)));
        };
        runPrune();
        this.cleanupTimer = setInterval(runPrune, 24 * 60 * 60 * 1000);
        this.cleanupTimer.unref?.();
    }
    onModuleDestroy() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
        }
        if (this.payloadCleanupTimer) {
            clearInterval(this.payloadCleanupTimer);
        }
    }
    async pruneDeliveryFailures(olderThanDays) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - olderThanDays);
        const result = await this.failureRepository.delete({ createdAt: (0, typeorm_2.LessThan)(cutoff) });
        return result.affected || 0;
    }
    async pruneDeliveryFailurePayloads(olderThanHours) {
        const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
        const result = await this.failureRepository.update({ payload: (0, typeorm_2.Not)((0, typeorm_2.IsNull)()), createdAt: (0, typeorm_2.LessThan)(cutoff) }, { payload: null });
        return result.affected || 0;
    }
    schedulePayloadPrune() {
        const hours = this.configService.get('webhook.failurePayloadRetentionHours', 0);
        const runPrune = () => {
            this.pruneDeliveryFailurePayloads(hours)
                .then(n => {
                if (n > 0)
                    this.logger.log(`Cleared the replay payload of ${n} webhook delivery-failure(s)`);
            })
                .catch(err => this.logger.error('Webhook delivery-failure payload cleanup failed', err instanceof Error ? err.stack : String(err)));
        };
        runPrune();
        if (hours > 0) {
            this.payloadCleanupTimer = setInterval(runPrune, 60 * 60 * 1000);
            this.payloadCleanupTimer.unref?.();
        }
    }
    async validateWebhookUrl(url) {
        let parsed = null;
        try {
            parsed = new URL(url);
        }
        catch {
        }
        if (parsed && (parsed.username !== '' || parsed.password !== '')) {
            throw new common_1.BadRequestException('Webhook URL must not contain credentials (userinfo)');
        }
        if (!(0, ssrf_guard_1.isSsrfProtectionEnabled)())
            return;
        try {
            await (0, ssrf_guard_1.assertSafeFetchUrl)(url);
        }
        catch (error) {
            if (error instanceof ssrf_guard_1.SsrfBlockedError) {
                this.logger.warn(`Webhook URL rejected by SSRF guard: ${error.message}`);
                throw new common_1.BadRequestException(ssrf_guard_1.SSRF_BLOCKED_CLIENT_MESSAGE);
            }
            throw error;
        }
    }
    async create(sessionId, dto) {
        const sessionExists = await this.sessionRepository.exists({ where: { id: sessionId } });
        if (!sessionExists) {
            throw new common_1.NotFoundException(`Session with id '${sessionId}' not found`);
        }
        await this.validateWebhookUrl(dto.url);
        const maxPerSession = this.configService.get('webhook.maxPerSession', DEFAULT_WEBHOOK_MAX_PER_SESSION);
        if (maxPerSession > 0) {
            const existing = await this.webhookRepository.count({ where: { sessionId } });
            if (existing >= maxPerSession) {
                throw new common_1.BadRequestException(`Webhook limit reached for this session (${existing}/${maxPerSession}); delete one before registering another`);
            }
        }
        const webhook = this.webhookRepository.create({
            sessionId,
            url: dto.url,
            events: dto.events || ['message.received'],
            secret: dto.secret || null,
            headers: dto.headers || {},
            filters: dto.filters ?? null,
            retryCount: dto.retryCount ?? 3,
        });
        const saved = await this.webhookRepository.save(webhook, { transaction: false });
        this.delivery.invalidateOptInSubscriptions(sessionId);
        return saved;
    }
    async findBySession(sessionId) {
        return this.webhookRepository.find({
            where: { sessionId },
            order: { createdAt: 'DESC' },
        });
    }
    async findAll(allowedSessions, opts = {}) {
        const { limit, offset } = (0, paginate_1.resolveListWindow)(opts.limit, opts.offset);
        const options = {
            order: { createdAt: 'DESC', id: 'DESC' },
            take: limit,
            skip: offset,
        };
        if (allowedSessions && allowedSessions.length > 0) {
            options.where = { sessionId: (0, typeorm_2.In)(allowedSessions) };
        }
        return this.webhookRepository.find(options);
    }
    async listDeliveryFailures(opts = {}, allowedSessions) {
        const { limit, offset } = (0, paginate_1.resolveListWindow)(opts.limit, opts.offset);
        const sessionScope = (0, session_scope_1.resolveSessionScope)(allowedSessions, opts.sessionId);
        if (sessionScope !== null && sessionScope.length === 0)
            return [];
        const rows = await this.failureRepository.find({
            where: sessionScope ? { sessionId: (0, typeorm_2.In)(sessionScope) } : {},
            order: { createdAt: 'DESC', id: 'DESC' },
            take: limit,
            skip: offset,
        });
        const replayable = new Set();
        const hours = this.configService.get('webhook.failurePayloadRetentionHours', 0);
        if (rows.length > 0 && hours > 0) {
            const withPayload = await this.failureRepository.find({
                select: { id: true },
                where: {
                    id: (0, typeorm_2.In)(rows.map(r => r.id)),
                    payload: (0, typeorm_2.Not)((0, typeorm_2.IsNull)()),
                    attempts: (0, typeorm_2.MoreThan)(0),
                    idempotencyKey: (0, typeorm_2.Not)((0, typeorm_2.IsNull)()),
                    createdAt: (0, typeorm_2.MoreThan)(new Date(Date.now() - hours * 60 * 60 * 1000)),
                },
            });
            for (const r of withPayload)
                replayable.add(r.id);
        }
        const held = rows.filter(r => replayable.has(r.id));
        if (held.length > 0) {
            const owners = await this.webhookRepository.find({
                select: { id: true, sessionId: true },
                where: { id: (0, typeorm_2.In)([...new Set(held.map(r => r.webhookId))]) },
            });
            const sessionOf = new Map(owners.map(w => [w.id, w.sessionId]));
            for (const r of held)
                if (sessionOf.get(r.webhookId) !== r.sessionId)
                    replayable.delete(r.id);
        }
        return rows.map(r => Object.assign(r, { replayable: replayable.has(r.id) }));
    }
    async findOne(sessionId, id) {
        const webhook = await this.webhookRepository.findOne({ where: { id, sessionId } });
        if (!webhook) {
            throw new common_1.NotFoundException(`Webhook with id '${id}' not found`);
        }
        return webhook;
    }
    async update(sessionId, id, dto) {
        const webhook = await this.findOne(sessionId, id);
        const patch = {};
        if (dto.url !== undefined && dto.url !== webhook.url) {
            await this.validateWebhookUrl(dto.url);
            patch.url = dto.url;
        }
        if (dto.events !== undefined)
            patch.events = dto.events;
        if (dto.secret !== undefined)
            patch.secret = dto.secret || null;
        if (dto.headers !== undefined)
            patch.headers = dto.headers;
        if (dto.filters !== undefined)
            patch.filters = dto.filters;
        if (dto.active !== undefined)
            patch.active = dto.active;
        if (dto.retryCount !== undefined)
            patch.retryCount = dto.retryCount;
        if (Object.keys(patch).length === 0)
            return webhook;
        const result = await this.webhookRepository.update({ id, sessionId }, patch);
        this.delivery.invalidateOptInSubscriptions(sessionId);
        if (!result.affected)
            throw new common_1.NotFoundException(`Webhook with id '${id}' not found`);
        return this.findOne(sessionId, id);
    }
    async delete(sessionId, id) {
        const webhook = await this.findOne(sessionId, id);
        await this.webhookRepository.remove(webhook);
        this.delivery.invalidateOptInSubscriptions(sessionId);
    }
    async test(sessionId, webhookId) {
        const webhook = await this.findOne(sessionId, webhookId);
        const deliveryId = (0, idempotency_util_1.generateDeliveryId)();
        const testPayload = {
            event: 'test',
            timestamp: new Date().toISOString(),
            sessionId,
            idempotencyKey: `test_${deliveryId}_${webhook.id}`,
            deliveryId,
            data: {
                message: 'This is a test webhook from OpenWA',
                webhookId: webhook.id,
                url: webhook.url,
            },
        };
        const body = JSON.stringify(testPayload);
        const headers = (0, deliver_once_1.buildDeliveryHeaders)(webhook, 'test', testPayload.idempotencyKey, deliveryId, body);
        try {
            return await (0, ssrf_guard_1.withSafeFetch)(webhook.url, {
                method: 'POST',
                headers,
                body,
                signal: AbortSignal.timeout(this.configService.get('webhook.timeout', 10000)),
            }, response => ({ success: response.ok, statusCode: response.status }), { guard: (0, ssrf_guard_1.isSsrfProtectionEnabled)() });
        }
        catch (error) {
            return {
                success: false,
                error: (0, ssrf_guard_1.redactSsrfError)(error, this.logger, 'webhook test'),
            };
        }
    }
    dispatch(sessionId, event, data) {
        return this.delivery.dispatch(sessionId, event, data);
    }
};
exports.WebhookService = WebhookService;
exports.WebhookService = WebhookService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(webhook_entity_1.Webhook, 'data')),
    __param(1, (0, typeorm_1.InjectRepository)(webhook_delivery_failure_entity_1.WebhookDeliveryFailure, 'data')),
    __param(2, (0, typeorm_1.InjectRepository)(session_entity_1.Session, 'data')),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        config_1.ConfigService,
        webhook_delivery_service_1.WebhookDeliveryService])
], WebhookService);
//# sourceMappingURL=webhook.service.js.map