"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setRestrictedSessionCount = setRestrictedSessionCount;
exports.registerRestrictedSessionRecount = registerRestrictedSessionRecount;
exports.getRestrictedSessionCount = getRestrictedSessionCount;
let restrictedSessions = 0;
let recount = null;
function setRestrictedSessionCount(count) {
    restrictedSessions = count;
}
function registerRestrictedSessionRecount(fn) {
    recount = fn;
}
function getRestrictedSessionCount() {
    return recount ? recount() : restrictedSessions;
}
//# sourceMappingURL=session-restriction-metrics.js.map