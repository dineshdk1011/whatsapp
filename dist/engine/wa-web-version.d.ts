type RemoteWebVersionPin = {
    webVersion: string;
    webVersionCache: {
        type: 'remote';
        remotePath: string;
    };
};
type LocalWebVersionPin = {
    webVersion: string;
    webVersionCache: {
        type: 'local';
        path: string;
        strict: true;
    };
};
export type WebVersionPin = RemoteWebVersionPin | LocalWebVersionPin;
export declare const WA_VERSION_REGISTRY_URL = "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/versions.json";
export declare const WEB_VERSION_SETTLE_MS: number;
export declare const PINNED_HTML_TIMEOUT_MS = 10000;
export declare function __resetWebVersionCache(): void;
export declare function pickSettledWebVersion(versions: unknown, now: number, currentVersion: string | null): string | null;
export declare function resolveCurrentWebVersion(fetcher?: typeof fetch): Promise<string | null>;
export declare function resolveWebVersionPin(fetcher?: typeof fetch): Promise<RemoteWebVersionPin | undefined>;
export declare function resolveWebVersionPin(fetcher: typeof fetch | undefined, cacheDir: string): Promise<WebVersionPin | undefined>;
export declare function getEffectiveWebVersionInfo(): {
    version: string | null;
    source: 'pinned' | 'auto' | 'native';
};
export {};
