"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashApiKey = hashApiKey;
const crypto_1 = require("crypto");
function hashApiKey(rawKey, pepper) {
    return pepper
        ? (0, crypto_1.createHmac)('sha256', pepper).update(rawKey).digest('hex')
        : (0, crypto_1.createHash)('sha256').update(rawKey).digest('hex');
}
//# sourceMappingURL=api-key-hash.js.map