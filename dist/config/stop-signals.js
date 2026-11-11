"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STOP_SIGNAL_REPEAT_WINDOW_MS = void 0;
exports.installStopSignalHandlers = installStopSignalHandlers;
const node_perf_hooks_1 = require("node:perf_hooks");
exports.STOP_SIGNAL_REPEAT_WINDOW_MS = 1000;
function installStopSignalHandlers(deps) {
    const exit = deps.exit ?? ((code) => process.exit(code));
    const now = deps.now ?? (() => node_perf_hooks_1.performance.now());
    const listen = deps.listen ?? ((signal, listener) => void process.on(signal, listener));
    let firstAt;
    const onStop = () => {
        if (firstAt === undefined) {
            firstAt = now();
            deps.shutdown();
            return;
        }
        if (now() - firstAt >= exports.STOP_SIGNAL_REPEAT_WINDOW_MS)
            exit(130);
    };
    for (const signal of ['SIGTERM', 'SIGINT'])
        listen(signal, onStop);
}
//# sourceMappingURL=stop-signals.js.map