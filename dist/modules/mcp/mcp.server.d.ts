import type { HttpAdapterHost } from '@nestjs/core';
import type { ChatScopeService } from '../auth/chat-scope.service';
import { type RequestHandler } from 'express';
import type { ToolRegistryService } from '../../core/agent-tools/tool-registry.service';
import { type AuthService } from '../auth/auth.service';
import type { AuditService } from '../audit/audit.service';
import type { KeyRateLimiter } from './mcp-rate-limit';
type HttpAdapter = NonNullable<HttpAdapterHost['httpAdapter']>;
export interface McpRequestContext {
    ipAddress?: string;
    method?: string;
    path?: string;
}
export declare function auditMcpAuthFailure(auditService: Pick<AuditService, 'logWarn'> | undefined, error: unknown, reqContext: McpRequestContext): void;
export interface MountMcpServerOptions {
    basePath?: string;
    serverInfo?: {
        name: string;
        version: string;
    };
    readOnly?: boolean;
}
export declare function createIpThrottle(ipRateLimiter: KeyRateLimiter): RequestHandler;
export declare function createKeyGate(authService: Pick<AuthService, 'validateApiKey'>, auditService: Pick<AuditService, 'logWarn'> | undefined): RequestHandler;
export declare function resolveMcpReadOnly(optionsReadOnly?: boolean): boolean;
export declare function mountMcpServer(httpAdapter: HttpAdapter, registry: ToolRegistryService, authService: AuthService, rateLimiter: KeyRateLimiter, ipRateLimiter: KeyRateLimiter, options?: MountMcpServerOptions, auditService?: AuditService, chatScope?: ChatScopeService): void;
export {};
