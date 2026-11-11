"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeFeatureFlags = computeFeatureFlags;
exports.resolveFeatureFlags = resolveFeatureFlags;
const env_int_1 = require("../common/utils/env-int");
function computeFeatureFlags(env = process.env) {
    return {
        autoStartSessions: env.AUTO_START_SESSIONS === 'true',
        storeEphemeralMessages: env.STORE_EPHEMERAL_MESSAGES !== 'false',
        resolveLidToPhone: env.RESOLVE_LID_TO_PHONE === 'true',
        simulateTyping: env.SIMULATE_TYPING !== 'false',
        simulateTypingMaxMs: (0, env_int_1.positiveIntOrDefault)(env.SIMULATE_TYPING_MAX_MS, 5000),
    };
}
function resolveFeatureFlags(configService) {
    const fromConfig = configService?.get('features');
    return fromConfig ?? computeFeatureFlags();
}
//# sourceMappingURL=feature-flags.js.map