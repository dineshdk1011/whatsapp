import { LoggerService as NestLoggerService } from '@nestjs/common';
export declare enum LogLevel {
    ERROR = "error",
    WARN = "warn",
    INFO = "info",
    DEBUG = "debug",
    VERBOSE = "verbose"
}
export declare enum LogFormat {
    JSON = "json",
    PRETTY = "pretty"
}
export interface LogContext {
    sessionId?: string;
    messageId?: string;
    webhookId?: string;
    action?: string;
    duration?: number;
    [key: string]: unknown;
}
export interface RedactOptions {
    isSecretKey?: (key: string) => boolean;
    marker?: string;
}
export declare const isSecretName: (key: string) => boolean;
export declare const REDACTED = "[REDACTED]";
export declare function writtenForm(node: object, form?: "error" | "date" | "map" | "set" | "boxed" | undefined, isSecretKey?: (key: string) => boolean, marker?: string): unknown;
export declare function redactSecrets(value: unknown, options?: RedactOptions): unknown;
export declare const UNPRINTABLE = "[Unprintable]";
export declare class LoggerService implements NestLoggerService {
    private context;
    private static logLevel;
    private static logFormat;
    static setLogLevel(level: LogLevel): void;
    static setLogFormat(format: LogFormat | null): void;
    setContext(context: string): void;
    log(message: unknown, context?: string | LogContext, fields?: LogContext): void;
    error(message: unknown, trace?: unknown, context?: string | LogContext, fields?: LogContext): void;
    fatal(message: unknown, context?: string | LogContext): void;
    warn(message: unknown, context?: string | LogContext, fields?: LogContext): void;
    debug(message: unknown, context?: string | LogContext, fields?: LogContext): void;
    verbose(message: unknown, context?: string | LogContext): void;
    private writeLog;
    private formatPretty;
    private static resolveFormat;
    private static colorEnabled;
    private shouldLog;
}
export declare function logFormatFromEnv(env?: NodeJS.ProcessEnv): LogFormat;
export declare function applyLogLevelFromEnv(raw?: string | undefined): void;
export declare function createLogger(context: string): LoggerService;
