"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.incrementWebhookDeliveryFailures = incrementWebhookDeliveryFailures;
exports.getWebhookDeliveryFailuresTotal = getWebhookDeliveryFailuresTotal;
let terminalFailureTotal = 0;
function incrementWebhookDeliveryFailures() {
    terminalFailureTotal += 1;
}
function getWebhookDeliveryFailuresTotal() {
    return terminalFailureTotal;
}
//# sourceMappingURL=webhook-delivery-metrics.js.map