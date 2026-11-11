"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.incrementSendPacingRefusals = incrementSendPacingRefusals;
exports.getSendPacingRefusals = getSendPacingRefusals;
exports.resetSendPacingRefusals = resetSendPacingRefusals;
const refusals = new Map();
function incrementSendPacingRefusals(reason) {
    refusals.set(reason, (refusals.get(reason) ?? 0) + 1);
}
function getSendPacingRefusals() {
    return refusals;
}
function resetSendPacingRefusals() {
    refusals.clear();
}
//# sourceMappingURL=send-pacing-metrics.js.map