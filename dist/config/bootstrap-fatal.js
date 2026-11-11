"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_BOOTSTRAP_CLOSE_TIMEOUT_MS = void 0;
exports.runBootstrapOrExit = runBootstrapOrExit;
exports.DEFAULT_BOOTSTRAP_CLOSE_TIMEOUT_MS = 5000;
async function runBootstrapOrExit(bootstrap, deps) {
    try {
        await bootstrap();
        return;
    }
    catch (err) {
        try {
            deps.logger.error('Fatal error during bootstrap — process will exit', err instanceof Error ? err.stack : String(err));
        }
        catch {
        }
    }
    if (deps.closeApp) {
        try {
            const closeApp = deps.closeApp;
            await Promise.race([
                Promise.resolve().then(() => closeApp()),
                new Promise(resolve => {
                    setTimeout(resolve, deps.closeTimeoutMs ?? exports.DEFAULT_BOOTSTRAP_CLOSE_TIMEOUT_MS);
                }),
            ]);
        }
        catch {
        }
    }
    (deps.exit ?? ((code) => process.exit(code)))(1);
}
//# sourceMappingURL=bootstrap-fatal.js.map