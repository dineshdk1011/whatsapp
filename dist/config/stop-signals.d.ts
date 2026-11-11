export declare const STOP_SIGNAL_REPEAT_WINDOW_MS = 1000;
export interface StopSignalHandlerDeps {
    shutdown: () => void;
    exit?: (code: number) => void;
    now?: () => number;
    listen?: (signal: NodeJS.Signals, listener: () => void) => void;
}
export declare function installStopSignalHandlers(deps: StopSignalHandlerDeps): void;
