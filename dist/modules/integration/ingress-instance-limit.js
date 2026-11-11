"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.admitIngressInstance = admitIngressInstance;
const configuration_1 = require("../../config/configuration");
async function admitIngressInstance(storage, pluginId, instanceId, env = process.env) {
    const limit = (0, configuration_1.resolveNonNegativeIntEnv)(env.INGRESS_INSTANCE_LIMIT, 120);
    const ttl = (0, configuration_1.resolveNonNegativeIntEnv)(env.INGRESS_INSTANCE_TTL, 60000);
    const record = await storage.increment(`ingress-instance:${pluginId}:${instanceId}`, ttl, limit, ttl, 'instance');
    if (record.isBlocked) {
        const wait = String(record.timeToBlockExpire);
        return { ok: false, headers: { 'Retry-After-instance': wait, 'Retry-After': wait } };
    }
    return {
        ok: true,
        headers: {
            'X-RateLimit-Limit-instance': String(limit),
            'X-RateLimit-Remaining-instance': String(Math.max(0, limit - record.totalHits)),
            'X-RateLimit-Reset-instance': String(record.timeToExpire),
        },
    };
}
//# sourceMappingURL=ingress-instance-limit.js.map