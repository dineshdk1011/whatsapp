"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeCustomHeaders = sanitizeCustomHeaders;
exports.isDeliverableWebhook = isDeliverableWebhook;
exports.generateSignature = generateSignature;
exports.buildDeliveryHeaders = buildDeliveryHeaders;
exports.postWebhookPayload = postWebhookPayload;
exports.recordTerminalFailure = recordTerminalFailure;
const crypto = __importStar(require("crypto"));
const ssrf_guard_1 = require("../../../common/security/ssrf-guard");
const record_delivery_failure_1 = require("./record-delivery-failure");
const wildcard_events_1 = require("../../../common/utils/wildcard-events");
function sanitizeCustomHeaders(custom) {
    const safe = {};
    for (const [key, value] of Object.entries(custom ?? {})) {
        if (!/^(content-type|x-openwa-)/i.test(key) &&
            !/^(user-agent|connection|content-length|expect|keep-alive|te|trailer|transfer-encoding|upgrade)$/i.test(key)) {
            safe[key] = value;
        }
    }
    return safe;
}
function isDeliverableWebhook(row, event, sessionId) {
    return (!!row &&
        (sessionId === undefined || row.sessionId === sessionId) &&
        row.active &&
        Array.isArray(row.events) &&
        (0, wildcard_events_1.subscriptionCoversEvent)(row.events, event));
}
function generateSignature(payload, secret) {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    return `sha256=${hmac.digest('hex')}`;
}
function buildDeliveryHeaders(webhook, event, idempotencyKey, deliveryId, body, retryCount = 0) {
    const headers = {
        ...sanitizeCustomHeaders(webhook.headers),
        'Content-Type': 'application/json',
        'User-Agent': 'OpenWA-Webhook/1.0.0',
        'X-OpenWA-Event': event,
        'X-OpenWA-Idempotency-Key': idempotencyKey,
        'X-OpenWA-Delivery-Id': deliveryId,
        'X-OpenWA-Retry-Count': String(retryCount),
    };
    if (webhook.secret) {
        headers['X-OpenWA-Signature'] = generateSignature(body, webhook.secret);
    }
    return headers;
}
async function postWebhookPayload(url, body, headers, timeoutMs, fetch = ssrf_guard_1.withSafeFetch) {
    const { ok, status, statusText } = await fetch(url, {
        method: 'POST',
        headers,
        body,
        signal: AbortSignal.timeout(timeoutMs),
    }, response => ({ ok: response.ok, status: response.status, statusText: response.statusText }), { guard: (0, ssrf_guard_1.isSsrfProtectionEnabled)() });
    if (!ok)
        throw new Error(`HTTP ${status}: ${statusText}`);
    return { status, statusText };
}
async function recordTerminalFailure(failureRepository, logger, input) {
    const { error, ...row } = input;
    const errMessage = (0, ssrf_guard_1.redactSsrfError)(error);
    return (0, record_delivery_failure_1.recordWebhookDeliveryFailure)(failureRepository, logger, {
        ...row,
        lastStatusCode: (0, record_delivery_failure_1.statusCodeFromError)(errMessage),
        lastError: errMessage,
    });
}
//# sourceMappingURL=deliver-once.js.map