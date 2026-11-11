import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction, AuditSeverity } from './entities/audit-log.entity';
import { ApiKey } from '../auth/entities/api-key.entity';
export declare const MAX_AUDIT_PAGE_SIZE = 200;
interface AuditContext {
    apiKey?: ApiKey;
    sessionId?: string;
    sessionName?: string;
    ipAddress?: string;
    userAgent?: string;
    method?: string;
    path?: string;
    statusCode?: number;
    metadata?: Record<string, unknown>;
    errorMessage?: string;
}
export interface AuditQueryOptions {
    action?: AuditAction;
    apiKeyId?: string;
    sessionId?: string;
    severity?: AuditSeverity;
    limit?: number;
    offset?: number;
}
export declare class AuditService implements OnModuleInit, OnModuleDestroy {
    private readonly auditRepository;
    private readonly logger;
    private cleanupTimer?;
    constructor(auditRepository: Repository<AuditLog>);
    onModuleInit(): void;
    onModuleDestroy(): void;
    log(action: AuditAction, context?: AuditContext, severity?: AuditSeverity): Promise<AuditLog | null>;
    logInfo(action: AuditAction, context?: AuditContext): Promise<AuditLog | null>;
    logWarn(action: AuditAction, context?: AuditContext): Promise<AuditLog | null>;
    findAll(options?: AuditQueryOptions, allowedSessions?: string[] | null): Promise<{
        data: AuditLog[];
        total: number;
    }>;
    cleanup(olderThanDays?: number): Promise<number>;
}
export {};
