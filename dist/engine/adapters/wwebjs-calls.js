"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WwebjsCalls = void 0;
const engine_not_supported_error_1 = require("../../common/errors/engine-not-supported.error");
class WwebjsCalls {
    host;
    static LIVE_CALL_TTL_MS = 2 * 60_000;
    liveCalls = new Map();
    constructor(host) {
        this.host = host;
    }
    handleIncomingCall(call) {
        try {
            if (this.host.isTearingDown() || !call?.id || !call.from) {
                return;
            }
            if (call.fromMe) {
                return;
            }
            if (!this.cacheLiveCall(call.id)) {
                return;
            }
            const payload = {
                callId: call.id,
                from: call.from ?? '',
                isVideo: call.isVideo === true,
                isGroup: call.isGroup === true,
                timestamp: typeof call.timestamp === 'number' && call.timestamp > 0
                    ? Math.floor(call.timestamp)
                    : Math.floor(Date.now() / 1000),
            };
            this.host.getCallbacks().onCall?.(payload);
        }
        catch (error) {
            this.host.logger.error('Error processing call event', String(error));
        }
    }
    cacheLiveCall(callId) {
        const now = Date.now();
        for (const [id, expiresAt] of this.liveCalls) {
            if (expiresAt <= now) {
                this.liveCalls.delete(id);
            }
        }
        const isNewCall = !this.liveCalls.has(callId);
        this.liveCalls.set(callId, now + WwebjsCalls.LIVE_CALL_TTL_MS);
        return isNewCall;
    }
    async rejectCall(_callId) {
        throw new engine_not_supported_error_1.EngineNotSupportedError('rejectCall');
    }
    clearLiveCalls() {
        this.liveCalls.clear();
    }
}
exports.WwebjsCalls = WwebjsCalls;
//# sourceMappingURL=wwebjs-calls.js.map