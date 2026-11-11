import type { Request } from 'express';
import { AuthService } from './auth.service';
import { CreateApiKeyDto, UpdateApiKeyDto, ApiKeyResponseDto, ApiKeyCreatedResponseDto } from './dto';
import { type ApiKey } from './entities/api-key.entity';
import { AuditService } from '../audit/audit.service';
export declare class AuthController {
    private readonly authService;
    private readonly auditService;
    constructor(authService: AuthService, auditService: AuditService);
    private auditContext;
    private authzSnapshot;
    private toResponse;
    create(dto: CreateApiKeyDto, req: Request, actor?: ApiKey): Promise<ApiKeyCreatedResponseDto>;
    findAll(): Promise<ApiKeyResponseDto[]>;
    findOne(id: string): Promise<ApiKeyResponseDto>;
    update(id: string, dto: UpdateApiKeyDto, req: Request, actor?: ApiKey): Promise<ApiKeyResponseDto>;
    delete(id: string, req: Request, actor?: ApiKey): Promise<void>;
    revoke(id: string, req: Request, actor?: ApiKey): Promise<ApiKeyResponseDto>;
}
