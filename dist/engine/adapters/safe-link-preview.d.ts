export interface SafeUrlInfo {
    'matched-text': string;
    'canonical-url': string;
    title: string;
    description?: string;
}
export declare function generateSafeLinkPreview(matchedText: string, opts?: {
    timeoutMs?: number;
    maxBytes?: number;
    sessionProxyUrl?: string;
}): Promise<SafeUrlInfo | undefined>;
