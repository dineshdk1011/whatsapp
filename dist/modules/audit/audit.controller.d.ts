import { AuditService } from './audit.service';
import { AuditLog, AuditAction, AuditSeverity } from './entities/audit-log.entity';
import { ApiKey } from '../auth/entities/api-key.entity';
export declare class AuditController {
    private readonly auditService;
    constructor(auditService: AuditService);
    findAll(apiKey?: ApiKey, action?: AuditAction | AuditAction[], severity?: AuditSeverity | AuditSeverity[], sessionId?: string, apiKeyId?: string, limit?: string, offset?: string): Promise<{
        data: AuditLog[];
        total: number;
    }>;
}
