export declare function expectedSha256FromUrl(url: string): string | null;
export declare function assertDownloadSha256(url: string, body: Buffer): void;
export declare function assertPluginInstallUrl(url: string): void;
export declare function fetchSafeBuffer(url: string, opts?: {
    maxBytes?: number;
    timeoutMs?: number;
}): Promise<Buffer>;
