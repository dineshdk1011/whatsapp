export declare const LINK_PREVIEW_THUMBNAIL_MAX_BYTES: number;
export declare function loadRemoteMediaBuffer(url: string, sessionProxyUrl: string | undefined, opts?: {
    maxBytes?: number;
}): Promise<{
    data: Buffer;
    mimetype: string;
}>;
