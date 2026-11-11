import { UnauthorizedException, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Repository } from 'typeorm';
import { ApiKey, ApiKeyRole } from './entities/api-key.entity';
import { CreateApiKeyDto, UpdateApiKeyDto } from './dto';
import { ApiKeyUsageTracker } from './api-key-usage-tracker.service';
import { ActiveKeyIndex } from './active-key-index';
export declare class UnresolvedApiKeyException extends UnauthorizedException {
    constructor(message: string);
}
export declare function resolveSeedApiKey(): string;
export declare function bannerKeyLine(displayKey: string, isNewKey: boolean): string;
export declare class AuthService implements OnModuleInit, OnModuleDestroy {
    private readonly apiKeyRepository;
    private readonly usageTracker;
    private readonly moduleRef;
    private readonly keyIndex?;
    private readonly logger;
    constructor(apiKeyRepository: Repository<ApiKey>, usageTracker: ApiKeyUsageTracker, moduleRef: ModuleRef, keyIndex?: ActiveKeyIndex | undefined);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    private readLiveBootstrapKey;
    private removeBootstrapKeyFileIfMatching;
    private seedApiKey;
    createApiKey(dto: CreateApiKeyDto): Promise<{
        apiKey: ApiKey;
        rawKey: string;
    }>;
    findAll(): Promise<ApiKey[]>;
    findOne(id: string): Promise<ApiKey>;
    update(id: string, dto: UpdateApiKeyDto): Promise<ApiKey>;
    delete(id: string): Promise<void>;
    revoke(id: string): Promise<ApiKey>;
    private static parseExpiry;
    private static usableAdminCondition;
    private static guardNowParam;
    private static readonly OUTLASTS_TARGET;
    private withLastAdminGuard;
    private assertMutationApplied;
    private applyUnguardedUpdate;
    private evictActiveSockets;
    findAuthorizationStates(ids: string[]): Promise<ApiKey[]>;
    validateApiKey(rawKey: string, clientIp?: string, sessionId?: string, { recordUsage }?: {
        recordUsage?: boolean;
    }): Promise<ApiKey>;
    private hashKey;
    private isIpAllowed;
    hasPermission(apiKey: ApiKey, requiredRole: ApiKeyRole): boolean;
}
