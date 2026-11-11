export interface RequestContext {
    requestId: string;
    apiKeyId?: string;
    apiKeyName?: string;
    ipAddress?: string;
}
export declare function runWithRequestId<T>(requestId: string, fn: () => T): T;
export declare function outsideRequest<T>(fn: () => T): T;
export declare function getRequestId(): string | undefined;
export declare function setRequestActor(actor: {
    apiKeyId?: string;
    apiKeyName?: string;
    ipAddress?: string;
}): void;
export declare function getRequestActor(): {
    apiKeyId?: string;
    apiKeyName?: string;
    ipAddress?: string;
} | undefined;
