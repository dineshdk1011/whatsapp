import type { ApiKey } from './entities/api-key.entity';
export declare function normalizeScopeList(list: string[] | null | undefined): string[] | null;
export declare function apiKeyExpiryTime(value: Date | string | null | undefined): number | null;
export type ApiKeyAuthorization = Pick<ApiKey, 'role' | 'allowedIps' | 'allowedSessions' | 'allowedChats' | 'expiresAt'>;
export declare function apiKeyAuthorizationFingerprint(key: ApiKeyAuthorization): string;
