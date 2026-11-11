export declare enum ApiKeyRole {
    ADMIN = "admin",
    OPERATOR = "operator",
    VIEWER = "viewer"
}
export declare class ApiKey {
    id: string;
    name: string;
    keyHash: string;
    keyPrefix: string;
    role: ApiKeyRole;
    allowedIps: string[] | null;
    allowedSessions: string[] | null;
    allowedChats: string[] | null;
    isActive: boolean;
    expiresAt: Date | null;
    lastUsedAt: Date | null;
    usageCount: number;
    createdAt: Date;
    updatedAt: Date;
}
