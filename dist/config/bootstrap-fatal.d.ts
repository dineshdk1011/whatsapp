export interface BootstrapFatalLogger {
    error: (message: string, detail?: string) => void;
}
export interface BootstrapFatalDeps {
    logger: BootstrapFatalLogger;
    closeApp?: () => Promise<unknown>;
    exit?: (code: number) => void;
    closeTimeoutMs?: number;
}
export declare const DEFAULT_BOOTSTRAP_CLOSE_TIMEOUT_MS = 5000;
export declare function runBootstrapOrExit(bootstrap: () => Promise<unknown>, deps: BootstrapFatalDeps): Promise<void>;
