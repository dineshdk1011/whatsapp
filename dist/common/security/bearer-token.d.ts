export declare function bearerToken(header: string | undefined): string | undefined;
interface KeyHeaders {
    'x-api-key'?: string | string[];
    authorization?: string | string[];
}
export declare function presentedApiKey(headers: KeyHeaders): string | undefined;
export {};
