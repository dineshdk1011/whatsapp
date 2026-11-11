"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var LoggerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerService = exports.UNPRINTABLE = exports.REDACTED = exports.isSecretName = exports.LogFormat = exports.LogLevel = void 0;
exports.writtenForm = writtenForm;
exports.redactSecrets = redactSecrets;
exports.logFormatFromEnv = logFormatFromEnv;
exports.applyLogLevelFromEnv = applyLogLevelFromEnv;
exports.createLogger = createLogger;
const node_util_1 = require("node:util");
const common_1 = require("@nestjs/common");
const request_context_1 = require("./request-context");
var LogLevel;
(function (LogLevel) {
    LogLevel["ERROR"] = "error";
    LogLevel["WARN"] = "warn";
    LogLevel["INFO"] = "info";
    LogLevel["DEBUG"] = "debug";
    LogLevel["VERBOSE"] = "verbose";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
var LogFormat;
(function (LogFormat) {
    LogFormat["JSON"] = "json";
    LogFormat["PRETTY"] = "pretty";
})(LogFormat || (exports.LogFormat = LogFormat = {}));
const SECRET_KEY_PATTERN = /password|passwd|secret|token|api[-_]?key|authorization|credential|pepper|private[-_]?key/i;
const REDACT_FULL_DEPTH = 5;
const REDACT_DEEP_NODES = 1000;
const REDACT_MAX_ARRAY_LENGTH = 1_000_000;
const REDACT_MAX_ENTRIES = 2_000_000;
const REDACT_MAX_CHARS = 2 ** 26;
const REDACT_BIGINT_WEIGHT = 16;
const isSecretName = (key) => SECRET_KEY_PATTERN.test(key);
exports.isSecretName = isSecretName;
exports.REDACTED = '[REDACTED]';
const TYPED_ARRAY_PROTOTYPE = Object.getPrototypeOf(Int8Array.prototype);
function elementCount(view) {
    try {
        return Reflect.get(TYPED_ARRAY_PROTOTYPE, 'length', view);
    }
    catch {
        return 0;
    }
}
function dateText(date) {
    return Number.isNaN(Date.prototype.getTime.call(date)) ? 'Invalid Date' : Date.prototype.toISOString.call(date);
}
function boxedValue(node) {
    if (node_util_1.types.isStringObject(node))
        return String.prototype.valueOf.call(node);
    return node_util_1.types.isNumberObject(node) ? Number.prototype.valueOf.call(node) : Boolean.prototype.valueOf.call(node);
}
function formOf(node) {
    try {
        if (node instanceof Date)
            return node_util_1.types.isDate(node) ? 'date' : undefined;
        if (node instanceof Map)
            return node_util_1.types.isMap(node) ? 'map' : undefined;
        if (node instanceof Set)
            return node_util_1.types.isSet(node) ? 'set' : undefined;
        if (node instanceof String)
            return node_util_1.types.isStringObject(node) ? 'boxed' : undefined;
        if (node instanceof Number)
            return node_util_1.types.isNumberObject(node) ? 'boxed' : undefined;
        if (node instanceof Boolean)
            return node_util_1.types.isBooleanObject(node) ? 'boxed' : undefined;
        return node instanceof Error && !node_util_1.types.isProxy(node) ? 'error' : undefined;
    }
    catch {
        return undefined;
    }
}
function writtenForm(node, form = formOf(node), isSecretKey = exports.isSecretName, marker = exports.REDACTED) {
    if (form === 'date')
        return dateText(node);
    if (form === 'boxed')
        return boxedValue(node);
    if (form === 'map' || form === 'set') {
        const items = [];
        if (form === 'map')
            Map.prototype.forEach.call(node, (item, key) => {
                const name = typeof key === 'object' && key !== null && formOf(key) === 'boxed' ? boxedValue(key) : key;
                items.push([key, typeof name === 'string' && isSecretKey(name) ? marker : item]);
            });
        else
            Set.prototype.forEach.call(node, (item) => items.push(item));
        return items;
    }
    const type = ArrayBuffer.isView(node) ? Reflect.get(TYPED_ARRAY_PROTOTYPE, Symbol.toStringTag, node) : 0;
    const props = typeof type === 'string'
        ? {
            type: Object.getPrototypeOf(node) === Buffer.prototype ? 'Buffer' : type,
            length: elementCount(node),
        }
        : node;
    if (form !== 'error')
        return props;
    const error = node;
    return { name: error.name, message: error.message, stack: error.stack, ...props };
}
function redactSecrets(value, options = {}) {
    const { isSecretKey = exports.isSecretName, marker = exports.REDACTED } = options;
    const budget = { nodes: REDACT_DEEP_NODES, entries: REDACT_MAX_ENTRIES, chars: REDACT_MAX_CHARS };
    const walk = (node, path) => {
        if (typeof node === 'function')
            return undefined;
        if (typeof node === 'string')
            return (budget.chars -= node.length) < 0 ? '[Truncated]' : node;
        if (node === null || typeof node !== 'object')
            return node;
        const form = formOf(node);
        if (form === 'date' || form === 'boxed')
            return walk(writtenForm(node, form, isSecretKey, marker), path);
        if (path.includes(node))
            return '[Circular]';
        const deep = path.length >= REDACT_FULL_DEPTH;
        if ((deep && --budget.nodes < 0) || budget.entries < 0 || budget.chars < 0)
            return '[Truncated]';
        const parents = [...path, node];
        const copy = (child) => {
            if (typeof child !== 'bigint')
                return walk(child, parents);
            if (budget.chars < 0)
                return '[Truncated]';
            const text = child.toString();
            return (budget.chars -= text.length * REDACT_BIGINT_WEIGHT) < 0 ? '[Truncated]' : text;
        };
        const left = Math.min(budget.entries, deep ? budget.nodes : Infinity);
        const room = Math.min(left, REDACT_MAX_ARRAY_LENGTH);
        let list = node;
        const map = form === 'map';
        if (map || form === 'set') {
            if (Reflect.get(map ? Map.prototype : Set.prototype, 'size', node) > room)
                return '[Truncated]';
            list = writtenForm(node, form, isSecretKey, marker);
        }
        if (Array.isArray(list)) {
            const length = Math.max(0, Math.trunc(list.length) || 0);
            if (length > room)
                return '[Truncated]';
            budget.entries -= length;
            const plain = new Array(length);
            for (let index = 0; index < length; index++)
                if (index in list)
                    plain[index] = copy(list[index]);
            return plain;
        }
        const source = (form === undefined && !ArrayBuffer.isView(node) ? node : writtenForm(node, form, isSecretKey, marker));
        const keys = Object.keys(source);
        if (keys.length > left) {
            budget.nodes -= keys.length;
            budget.entries -= keys.length;
            return '[Truncated]';
        }
        budget.entries -= keys.length;
        const out = {};
        for (const key of keys) {
            if (budget.chars >= 0 && (budget.chars -= key.length) < 0)
                return '[Truncated]';
            const val = source[key];
            if (key === 'toJSON' && typeof val === 'function')
                continue;
            const written = isSecretKey(key) ? marker : copy(val);
            if (key === '__proto__')
                Object.defineProperty(out, key, { value: written, enumerable: true, writable: true, configurable: true });
            else
                out[key] = written;
        }
        return out;
    };
    return walk(value, []);
}
exports.UNPRINTABLE = '[Unprintable]';
function plainText(value) {
    return value === null || (typeof value !== 'object' && typeof value !== 'function') ? String(value) : exports.UNPRINTABLE;
}
function stringifyMessage(message) {
    try {
        return JSON.stringify(redactSecrets(message)) ?? plainText(message);
    }
    catch {
        return plainText(message);
    }
}
const ANSI = {
    reset: '\x1b[0m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
};
const LEVEL_COLOR = {
    [LogLevel.ERROR]: ANSI.red,
    [LogLevel.WARN]: ANSI.yellow,
    [LogLevel.INFO]: ANSI.green,
    [LogLevel.DEBUG]: ANSI.magenta,
    [LogLevel.VERBOSE]: ANSI.cyan,
};
const LEVEL_LABEL = {
    [LogLevel.ERROR]: 'ERROR',
    [LogLevel.WARN]: 'WARN',
    [LogLevel.INFO]: 'LOG',
    [LogLevel.DEBUG]: 'DEBUG',
    [LogLevel.VERBOSE]: 'VERBOSE',
};
const STRUCTURAL_KEYS = new Set(['timestamp', 'level', 'context', 'message', 'trace']);
let LoggerService = class LoggerService {
    static { LoggerService_1 = this; }
    context = 'Application';
    static logLevel = LogLevel.INFO;
    static logFormat = null;
    static setLogLevel(level) {
        LoggerService_1.logLevel = level;
    }
    static setLogFormat(format) {
        LoggerService_1.logFormat = format;
    }
    setContext(context) {
        this.context = context;
    }
    log(message, context, fields) {
        this.writeLog(LogLevel.INFO, message, context, undefined, fields);
    }
    error(message, trace, context, fields) {
        this.writeLog(LogLevel.ERROR, message, context, trace, fields);
    }
    fatal(message, context) {
        this.writeLog(LogLevel.ERROR, message, context);
    }
    warn(message, context, fields) {
        this.writeLog(LogLevel.WARN, message, context, undefined, fields);
    }
    debug(message, context, fields) {
        this.writeLog(LogLevel.DEBUG, message, context, undefined, fields);
    }
    verbose(message, context) {
        this.writeLog(LogLevel.VERBOSE, message, context);
    }
    writeLog(level, rawMessage, context, rawTrace, fields) {
        if (!this.shouldLog(level))
            return;
        let message;
        try {
            if (rawMessage instanceof Error) {
                rawTrace ??= rawMessage.stack;
                rawMessage = rawMessage.message;
            }
            message = typeof rawMessage === 'string' ? rawMessage : stringifyMessage(rawMessage);
        }
        catch {
            message = exports.UNPRINTABLE;
        }
        let trace;
        try {
            const text = rawTrace instanceof Error ? (rawTrace.stack ?? rawTrace.message) : rawTrace;
            trace = text === undefined || typeof text === 'string' ? text : stringifyMessage(text);
        }
        catch {
            trace = exports.UNPRINTABLE;
        }
        const timestamp = new Date().toISOString();
        const contextName = typeof context === 'string' ? context : this.context;
        const requestId = (0, request_context_1.getRequestId)();
        const render = (metadata) => {
            const logEntry = {
                timestamp,
                level,
                context: contextName,
                message,
                ...Object.fromEntries(Object.entries(metadata).filter(([key]) => !STRUCTURAL_KEYS.has(key) && key !== 'requestId')),
                ...(trace !== undefined ? { trace } : {}),
                ...(requestId ? { requestId } : {}),
            };
            return LoggerService_1.resolveFormat() === LogFormat.PRETTY
                ? this.formatPretty(level, logEntry)
                : JSON.stringify(logEntry);
        };
        const own = typeof fields === 'object' && fields !== null;
        let added = {};
        let output;
        try {
            if (own)
                added = redactSecrets(fields);
            const copy = typeof context === 'object' && context !== null ? redactSecrets(context) : {};
            const metadata = typeof copy === 'string' ? { metadata: copy } : copy;
            output = render(own ? { ...metadata, ...added } : metadata);
        }
        catch {
            output = render({ metadata: '[Unreadable]', ...added });
        }
        switch (level) {
            case LogLevel.ERROR:
                console.error(output);
                break;
            case LogLevel.WARN:
                console.warn(output);
                break;
            default:
                console.log(output);
        }
    }
    formatPretty(level, entry) {
        const useColor = LoggerService_1.colorEnabled();
        const paint = (code, text) => (useColor ? `${code}${text}${ANSI.reset}` : text);
        const levelColor = LEVEL_COLOR[level];
        const label = LEVEL_LABEL[level].padStart(7);
        const timestamp = new Date(String(entry.timestamp)).toLocaleString();
        const contextName = String(entry.context);
        const message = String(entry.message);
        const formatValue = (value) => (typeof value === 'string' ? value : (JSON.stringify(value) ?? ''));
        const meta = Object.entries(entry)
            .filter(([key, value]) => !STRUCTURAL_KEYS.has(key) && value !== undefined)
            .map(([key, value]) => `${key}=${formatValue(value)}`)
            .join(' ');
        let line = `${paint(levelColor, `[OpenWA] ${process.pid}  -`)} ${timestamp} ` +
            `${paint(levelColor, label)} ${paint(ANSI.yellow, `[${contextName}]`)} ${paint(levelColor, message)}`;
        if (meta) {
            line += ` ${paint(ANSI.dim, meta)}`;
        }
        if (typeof entry.trace === 'string' && entry.trace) {
            line += `\n${paint(levelColor, entry.trace)}`;
        }
        return line;
    }
    static resolveFormat() {
        return LoggerService_1.logFormat ?? logFormatFromEnv();
    }
    static colorEnabled() {
        if (process.env.NO_COLOR)
            return false;
        if (process.env.FORCE_COLOR)
            return true;
        return Boolean(process.stdout.isTTY);
    }
    shouldLog(level) {
        const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG, LogLevel.VERBOSE];
        const currentIndex = levels.indexOf(LoggerService_1.logLevel);
        const targetIndex = levels.indexOf(level);
        return targetIndex <= currentIndex;
    }
};
exports.LoggerService = LoggerService;
exports.LoggerService = LoggerService = LoggerService_1 = __decorate([
    (0, common_1.Injectable)({ scope: common_1.Scope.TRANSIENT })
], LoggerService);
function logFormatFromEnv(env = process.env) {
    const explicit = env.LOG_FORMAT?.trim().toLowerCase();
    if (explicit === LogFormat.JSON || explicit === LogFormat.PRETTY) {
        return explicit;
    }
    return env.NODE_ENV === 'production' ? LogFormat.JSON : LogFormat.PRETTY;
}
function applyLogLevelFromEnv(raw = process.env.LOG_LEVEL) {
    const requested = raw?.trim().toLowerCase();
    if (requested && Object.values(LogLevel).includes(requested)) {
        LoggerService.setLogLevel(requested);
    }
}
function createLogger(context) {
    const logger = new LoggerService();
    logger.setContext(context);
    return logger;
}
//# sourceMappingURL=logger.service.js.map