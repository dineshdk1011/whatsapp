export declare class FfmpegConversionError extends Error {
    readonly detail: string;
    constructor(message: string, detail?: string);
}
export declare class FfmpegSpawnError extends FfmpegConversionError {
    constructor(message: string);
}
export interface FfmpegRunOptions {
    ffmpegPath: string;
    timeoutMs: number;
    maxOutputBytes: number;
    signal?: AbortSignal;
}
export declare const INPUT_FORMATS: string;
export declare function buildFfmpegArgs(inputPath: string, outputPath: string, encodeArgs: string[], maxOutputBytes: number): string[];
export declare function voiceEncodeArgs(): string[];
export declare function videoEncodeArgs(): string[];
export declare function runFfmpeg(input: Buffer, inputExtension: string, outputExtension: string, encodeArgs: string[], options: FfmpegRunOptions): Promise<Buffer>;
export declare function removeStaleConversionDirs(minAgeMs: number, warn: (message: string, error: unknown) => void, now?: number): Promise<number>;
export declare function killRunningConversions(): void;
export declare function probeFfmpeg(ffmpegPath: string, timeoutMs?: number): Promise<boolean>;
