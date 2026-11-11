import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { ShutdownService } from '../../common/services/shutdown.service';
import { AuthService } from '../auth/auth.service';
import { AuditService } from '../audit/audit.service';
interface DependencyStatus {
    status: 'up' | 'down';
}
interface HealthCheckResult {
    status: 'ok' | 'error';
    details: Record<string, DependencyStatus>;
}
export declare class HealthController {
    private readonly mainDataSource;
    private readonly dataDataSource;
    private readonly shutdownService;
    private readonly authService;
    private readonly configService;
    private readonly auditService;
    constructor(mainDataSource: DataSource, dataDataSource: DataSource, shutdownService: ShutdownService, authService: AuthService, configService: ConfigService, auditService: AuditService);
    private readonly authFailureAuditLimiter;
    private readonly keyValidationLimiter;
    check(req: Request): Promise<{
        status: string;
        timestamp: string;
        version?: string;
    }>;
    private hasValidApiKey;
    liveness(): {
        status: string;
    };
    readiness(): Promise<HealthCheckResult>;
    private probeDatabase;
    private withTimeout;
}
export {};
