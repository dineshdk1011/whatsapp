export declare function stripBase64DataUri(base64: string | null | undefined): string | undefined;
export declare function assertBase64WithinMediaCap(base64: string | null | undefined, capBytes?: number): void;
export declare function assertBase64LengthWithinMediaCap(chars: number): void;
export interface MediaBody {
    url?: string;
    base64?: string;
    mimetype?: string;
}
export interface MediaBodyOptions {
    fallbackMimetype: string;
    requireMimetypeForBase64?: boolean;
    checkUrl?: boolean;
}
export declare function resolveMediaBody(body: MediaBody | undefined, options: MediaBodyOptions): {
    mimetype: string;
    data: string;
};
