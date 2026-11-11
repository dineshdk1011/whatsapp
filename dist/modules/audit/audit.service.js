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
exports.AuditService = exports.MAX_AUDIT_PAGE_SIZE = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const audit_log_entity_1 = require("./entities/audit-log.entity");
const logger_service_1 = require("../../common/services/logger.service");
const request_context_1 = require("../../common/services/request-context");
const session_scope_1 = require("../../common/security/session-scope");
exports.MAX_AUDIT_PAGE_SIZE = 200;
const MAX_USER_AGENT_LENGTH = 500;
const MAX_METHOD_LENGTH = 10;
const MAX_PATH_LENGTH = 500;
const MAX_ERROR_MESSAGE_LENGTH = 1000;
const clampText = (value, max) => (value ? value.slice(0, max) : null);
let AuditService = class AuditService {
    auditRepository;
    logger = (0, logger_service_1.createLogger)('AuditService');
    cleanupTimer;
    constructor(auditRepository) {
        this.auditRepository = auditRepository;
    }
    onModuleInit() {
        const parsed = Number.parseInt(process.env.AUDIT_RETENTION_DAYS ?? '', 10);
        const retentionDays = Number.isInteger(parsed) ? Math.max(0, parsed) : 90;
        if (retentionDays <= 0) {
            this.logger.log('Audit-log retention disabled (AUDIT_RETENTION_DAYS <= 0)');
            return;
        }
        const runCleanup = () => {
            this.cleanup(retentionDays)
                .then(n => {
                if (n > 0)
                    this.logger.log(`Pruned ${n} audit log(s) older than ${retentionDays} day(s)`);
            })
                .catch(err => this.logger.error('Audit-log cleanup failed', err instanceof Error ? err.stack : String(err)));
        };
        runCleanup();
        this.cleanupTimer = setInterval(runCleanup, 24 * 60 * 60 * 1000);
        this.cleanupTimer.unref?.();
    }
    onModuleDestroy() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
        }
    }
    async log(action, context = {}, severity = audit_log_entity_1.AuditSeverity.INFO) {
        const requestId = (0, request_context_1.getRequestId)();
        const actor = (0, request_context_1.getRequestActor)();
        const apiKeyId = context.apiKey?.id ?? actor?.apiKeyId;
        const apiKeyName = context.apiKey?.name ?? actor?.apiKeyName;
        const ipAddress = context.ipAddress ?? actor?.ipAddress;
        const metadata = context.metadata || requestId ? { ...(context.metadata ?? {}), ...(requestId ? { requestId } : {}) } : null;
        const auditLog = this.auditRepository.create({
            action,
            severity,
            apiKeyId: apiKeyId || null,
            apiKeyName: apiKeyName || null,
            sessionId: context.sessionId || null,
            sessionName: context.sessionName || null,
            ipAddress: ipAddress || null,
            userAgent: clampText(context.userAgent, MAX_USER_AGENT_LENGTH),
            method: clampText(context.method, MAX_METHOD_LENGTH),
            path: clampText(context.path, MAX_PATH_LENGTH),
            statusCode: context.statusCode || null,
            metadata,
            errorMessage: clampText(context.errorMessage, MAX_ERROR_MESSAGE_LENGTH),
        });
        try {
            return await this.auditRepository.save(auditLog);
        }
        catch (error) {
            this.logger.error(`Failed to write audit log for ${String(action)}`, error instanceof Error ? error.stack : String(error), { action: String(action) });
            return null;
        }
    }
    async logInfo(action, context = {}) {
        return this.log(action, context, audit_log_entity_1.AuditSeverity.INFO);
    }
    async logWarn(action, context = {}) {
        return this.log(action, context, audit_log_entity_1.AuditSeverity.WARN);
    }
    async findAll(options = {}, allowedSessions) {
        const where = {};
        if (options.action)
            where.action = options.action;
        if (options.apiKeyId)
            where.apiKeyId = options.apiKeyId;
        const sessionScope = (0, session_scope_1.resolveSessionScope)(allowedSessions, options.sessionId);
        if (sessionScope !== null) {
            if (sessionScope.length === 0)
                return { data: [], total: 0 };
            where.sessionId = (0, typeorm_2.In)(sessionScope);
        }
        if (options.severity)
            where.severity = options.severity;
        const requested = options.limit && options.limit > 0 ? options.limit : 50;
        const take = Math.min(requested, exports.MAX_AUDIT_PAGE_SIZE);
        const [data, total] = await this.auditRepository.findAndCount({
            where,
            order: { createdAt: 'DESC', id: 'DESC' },
            take,
            skip: options.offset && options.offset > 0 ? Math.min(options.offset, Number.MAX_SAFE_INTEGER) : 0,
        });
        return { data, total };
    }
    async cleanup(olderThanDays = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
        const result = await this.auditRepository.delete({
            createdAt: (0, typeorm_2.LessThan)(cutoffDate),
        });
        return result.affected || 0;
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog, 'main')),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AuditService);
//# sourceMappingURL=audit.service.js.map