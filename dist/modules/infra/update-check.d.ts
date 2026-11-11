export interface UpdateCheck {
    current: string;
    latest: string | null;
    updateAvailable: boolean;
    releaseUrl: string | null;
}
export declare function __resetUpdateCheckCache(): void;
export declare function isNewerRelease(latest: string, current: string): boolean;
export declare function checkForUpdate(): Promise<UpdateCheck>;
