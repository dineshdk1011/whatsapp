import { type LookupFunction } from 'net';
import { type LookupAddress } from 'dns';
import { type RequestInit, type Response } from 'undici';
export declare class SsrfBlockedError extends Error {
    constructor(message: string);
}
export declare const SSRF_BLOCKED_CLIENT_MESSAGE = "Destination address is not allowed";
export declare function redactSsrfError(error: unknown, logger?: {
    warn: (message: string) => void;
}, site?: string): string;
export declare function isSsrfProtectionEnabled(): boolean;
export declare function warnUnusableAllowedHosts(entries?: readonly string[]): void;
export declare function isBlockedAddress(ip: string): boolean;
export declare function assertNoRedirect(response: {
    status: number;
    type?: string;
}, url: string): void;
export declare function resolveSafeFetchTarget(rawUrl: string, signal?: AbortSignal | null): Promise<LookupAddress[] | null>;
export declare function assertSafeFetchUrl(rawUrl: string, signal?: AbortSignal | null): Promise<void>;
export declare function pinnedLookup(addresses: LookupAddress[]): LookupFunction;
export declare function withSafeFetch<T>(rawUrl: string, init: RequestInit, use: (response: Response) => Promise<T> | T, opts?: {
    guard?: boolean;
    followRedirects?: boolean;
    proxyUrl?: string;
}): Promise<T>;
