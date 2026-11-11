export interface HttpTimeoutConfig {
    requestTimeoutMs: number;
    headersTimeoutMs: number;
    keepAliveTimeoutMs: number;
}
export declare function resolveRequestTimeoutMs(raw: string | undefined): number;
export type HttpTimeoutReport = HttpTimeoutConfig;
export interface HttpTimeoutSink {
    requestTimeout: number;
    headersTimeout: number;
    keepAliveTimeout: number;
}
export declare function applyHttpTimeouts(server: HttpTimeoutSink, cfg: HttpTimeoutConfig): HttpTimeoutReport;
