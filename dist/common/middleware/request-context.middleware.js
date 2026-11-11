"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestContextMiddleware = requestContextMiddleware;
const node_crypto_1 = require("node:crypto");
const request_context_1 = require("../services/request-context");
const CLIENT_REQUEST_ID_PATTERN = /^[A-Za-z0-9-]{1,128}$/;
function requestContextMiddleware(req, res, next) {
    const incoming = req.header('x-request-id');
    const requestId = incoming && CLIENT_REQUEST_ID_PATTERN.test(incoming) ? incoming : (0, node_crypto_1.randomUUID)();
    res.setHeader('X-Request-ID', requestId);
    (0, request_context_1.runWithRequestId)(requestId, next);
}
//# sourceMappingURL=request-context.middleware.js.map