export declare class AuditLogDto {
    id: string;
    action: string;
    severity: string;
    apiKeyId: string | null;
    apiKeyName: string | null;
    sessionId: string | null;
    sessionName: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    method: string | null;
    path: string | null;
    statusCode: number | null;
    metadata: object | null;
    errorMessage: string | null;
    createdAt: string;
}
export declare class AuditListResponseDto {
    data: AuditLogDto[];
    total: number;
}
