"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUncaughtExceptionMonitor = registerUncaughtExceptionMonitor;
exports.registerUnhandledRejectionHandler = registerUnhandledRejectionHandler;
const process_error_metrics_1 = require("../common/metrics/process-error-metrics");
const PAGE_CONTEXT_LOST_REJECTION = /execution context was destroyed|window\.require is not a function/i;
function safeString(value) {
    try {
        return String(value);
    }
    catch {
        return Object.prototype.toString.call(value);
    }
}
function registerUncaughtExceptionMonitor(logger) {
    process.on('uncaughtExceptionMonitor', (err, origin) => {
        try {
            logger.error(`Uncaught exception (${origin}) — process will exit`, err instanceof Error ? err.stack : String(err));
        }
        catch {
        }
    });
}
function registerUnhandledRejectionHandler(logger) {
    process.on('unhandledRejection', (reason) => {
        const message = reason instanceof Error ? reason.message : safeString(reason);
        const detail = reason instanceof Error ? reason.stack : safeString(reason);
        const pageContextLost = PAGE_CONTEXT_LOST_REJECTION.test(message);
        (0, process_error_metrics_1.incrementUnhandledRejections)(pageContextLost ? 'page_context_lost' : 'other');
        if (pageContextLost) {
            logger.warn('Puppeteer rejection after the page it was evaluating went away (navigation or engine ' +
                "teardown) — expected; the session recovers on its own. Check the session's own " +
                'disconnect/failure logs for the outcome.', { reason: detail, action: 'page_context_lost_rejection' });
            return;
        }
        logger.error('Unhandled promise rejection', detail);
    });
}
//# sourceMappingURL=process-error-monitor.js.map