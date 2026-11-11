"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allowUnauthenticatedAuditRow = allowUnauthenticatedAuditRow;
const ws_rate_limit_1 = require("../events/ws-rate-limit");
const ip_1 = require("../../common/utils/ip");
const limiter = new ws_rate_limit_1.SlidingWindowLimiter(10, 60_000);
function allowUnauthenticatedAuditRow(clientIp) {
    return limiter.allow((0, ip_1.limiterKeyForIp)(clientIp));
}
//# sourceMappingURL=auth-failure-audit-limiter.js.map