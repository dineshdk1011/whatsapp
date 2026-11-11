"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireClient = requireClient;
exports.rethrowIfNavigation = rethrowIfNavigation;
exports.withPage = withPage;
exports.reportPageDeath = reportPageDeath;
const engine_not_ready_error_1 = require("../../common/errors/engine-not-ready.error");
const engine_transport_error_1 = require("../../common/errors/engine-transport.error");
const wwebjs_lifecycle_1 = require("./wwebjs-lifecycle");
function requireClient(host) {
    const client = host.getClient();
    if (!client)
        throw new engine_not_ready_error_1.EngineNotReadyError();
    return client;
}
function rethrowIfNavigation(host, error) {
    if ((0, wwebjs_lifecycle_1.isNavigationError)(error) && !host.isPageTransportError(error))
        throw new engine_not_ready_error_1.EngineNotReadyError(wwebjs_lifecycle_1.PAGE_RELOADING_MESSAGE);
}
async function withPage(host, context, op) {
    try {
        return await op();
    }
    catch (error) {
        rethrowIfNavigation(host, error);
        if (host.isPageTransportError(error)) {
            host.reportIfPageTransportError(error, context);
            throw new engine_transport_error_1.EngineTransportError(`Transport died during ${context}`);
        }
        throw error;
    }
}
async function reportPageDeath(host, context, op) {
    try {
        return await op();
    }
    catch (error) {
        host.reportIfPageTransportError(error, context);
        const mapped = (0, wwebjs_lifecycle_1.toCapturedPageError)(error);
        if (mapped !== error) {
            host.logger.warn(`WhatsApp Web threw during ${context}`, {
                sessionId: host.config.sessionId,
                cause: error.message,
            });
        }
        throw mapped;
    }
}
//# sourceMappingURL=wwebjs-host.js.map