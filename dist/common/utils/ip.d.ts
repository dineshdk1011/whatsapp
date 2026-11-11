export declare function normalizeIp(ip: string): string;
export interface RequestLike {
    ip?: string;
    socket?: {
        remoteAddress?: string;
    };
    headers: Record<string, string | string[] | undefined>;
}
export declare function resolveClientIp(req: RequestLike, trustedProxies: string[]): string;
export declare function limiterKeyForIp(ip: string): string;
export declare function isIpOrCidrEntry(entry: string): boolean;
export declare function invalidTrustedProxies(raw: string | undefined): string[];
export declare function parseTrustedProxies(raw: string | undefined): string[];
export declare function ipMatches(ip: string, target: string): boolean;
