"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.constantTimeEqual = constantTimeEqual;
const node_crypto_1 = require("node:crypto");
const EQ_KEY = (0, node_crypto_1.randomBytes)(32);
function constantTimeEqual(a, b) {
    const ha = (0, node_crypto_1.createHash)('sha256').update(EQ_KEY).update(a).digest();
    const hb = (0, node_crypto_1.createHash)('sha256').update(EQ_KEY).update(b).digest();
    return (0, node_crypto_1.timingSafeEqual)(ha, hb);
}
//# sourceMappingURL=constantTimeEqual.js.map