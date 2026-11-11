import { ApiKeyRole } from '../entities/api-key.entity';
export declare const ALLOWED_CHATS_MAX = 2000;
export declare class CreateApiKeyDto {
    name: string;
    role?: ApiKeyRole;
    allowedIps?: string[];
    allowedSessions?: string[];
    allowedChats?: string[];
    expiresAt?: string;
}
export declare class ApiKeyResponseDto {
    id: string;
    name: string;
    keyPrefix: string;
    role: ApiKeyRole;
    allowedIps?: string[];
    allowedSessions?: string[];
    allowedChats?: string[];
    isActive: boolean;
    expiresAt?: Date;
    lastUsedAt?: Date;
    usageCount: number;
    createdAt: Date;
}
export declare class ApiKeyCreatedResponseDto extends ApiKeyResponseDto {
    apiKey: string;
}
export declare class ValidateApiKeyResponseDto {
    valid: boolean;
    role?: ApiKeyRole;
    engineType?: string;
    scoped?: boolean;
}
export declare class UpdateApiKeyDto {
    name?: string;
    role?: ApiKeyRole;
    allowedIps?: string[];
    allowedSessions?: string[];
    allowedChats?: string[];
    expiresAt?: string | null;
}
