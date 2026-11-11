"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.incrementUnhandledRejections = incrementUnhandledRejections;
exports.getUnhandledRejections = getUnhandledRejections;
const unhandledRejections = { page_context_lost: 0, other: 0 };
function incrementUnhandledRejections(kind) {
    unhandledRejections[kind] += 1;
}
function getUnhandledRejections() {
    return { ...unhandledRejections };
}
//# sourceMappingURL=process-error-metrics.js.map