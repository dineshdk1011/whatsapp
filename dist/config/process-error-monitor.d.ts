interface FatalLogger {
    error: (message: string, detail?: string) => void;
}
interface RejectionLogger extends FatalLogger {
    warn: (message: string, context?: Record<string, unknown>) => void;
}
export declare function registerUncaughtExceptionMonitor(logger: FatalLogger): void;
export declare function registerUnhandledRejectionHandler(logger: RejectionLogger): void;
export {};
