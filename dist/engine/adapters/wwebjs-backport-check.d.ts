export declare const BACKPORT_MISSING_MESSAGE: string;
export declare function partialBackportMessage(sites: string[]): string;
export declare function isBackportMissing(wwjsDir?: string): boolean;
export declare function partialBackportSites(wwjsDir?: string): string[];
export declare function backportProblem(wwjsDir?: string): string | undefined;
