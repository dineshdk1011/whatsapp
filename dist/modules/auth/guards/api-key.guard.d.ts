import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { ChatScopeService } from '../chat-scope.service';
import { AuditService } from '../../audit/audit.service';
export declare class ApiKeyGuard implements CanActivate {
    private readonly authService;
    private readonly reflector;
    private readonly configService;
    private readonly auditService;
    private readonly chatScope;
    constructor(authService: AuthService, reflector: Reflector, configService: ConfigService, auditService: AuditService, chatScope: ChatScopeService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private authorize;
    private static readonly CHAT_ROUTE_PARAMS;
    private static readonly CHAT_BODY_FIELDS;
    private static readonly CHAT_BULK_MAX;
    private chatIdsIn;
    private assertChatsAllowed;
    private extractApiKey;
    private getClientIp;
}
