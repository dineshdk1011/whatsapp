"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSilentLogger = createSilentLogger;
exports.createBaileysLogger = createBaileysLogger;
const logger_service_1 = require("../../common/services/logger.service");
function createSilentLogger() {
    const noop = () => { };
    const logger = {
        level: 'silent',
        child: () => logger,
        trace: noop,
        debug: noop,
        info: noop,
        warn: noop,
        error: noop,
    };
    return logger;
}
const SECRET_KEYS = new Set(['password', 'secret', 'token', 'apikey', 'api_key', 'authorization']);
const REDACTION = {
    isSecretKey: key => SECRET_KEYS.has(key.toLowerCase()),
    marker: '[redacted]',
};
const BAILEYS_LOG_LEVELS = ['trace', 'debug', 'info', 'warn', 'error'];
function createBaileysLogger() {
    const configured = (process.env.BAILEYS_LOG_LEVEL ?? 'silent').toLowerCase();
    if (!BAILEYS_LOG_LEVELS.includes(configured)) {
        return createSilentLogger();
    }
    const threshold = BAILEYS_LOG_LEVELS.indexOf(configured);
    const write = (lvl) => (obj, msg) => {
        if (BAILEYS_LOG_LEVELS.indexOf(lvl) < threshold) {
            return;
        }
        const head = { ts: new Date().toISOString(), level: lvl, context: 'baileys-wire' };
        let line;
        try {
            const copy = typeof obj === 'string' ? undefined : (0, logger_service_1.redactSecrets)(obj, REDACTION);
            const rec = typeof obj === 'string'
                ? { msg: obj }
                : {
                    ...(typeof copy === 'string' ? { metadata: copy } : copy),
                    ...(msg ? { msg } : {}),
                };
            line = JSON.stringify({ ...head, ...rec });
        }
        catch {
            line = JSON.stringify({ ...head, ...(msg ? { msg } : {}), metadata: '[Unreadable]' });
        }
        process.stdout.write(line + '\n');
    };
    const logger = {
        level: configured,
        child: () => logger,
        trace: write('trace'),
        debug: write('debug'),
        info: write('info'),
        warn: write('warn'),
        error: write('error'),
    };
    return logger;
}
//# sourceMappingURL=baileys-logger.js.map