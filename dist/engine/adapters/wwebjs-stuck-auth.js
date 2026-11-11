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
exports.WwebjsStuckAuth = void 0;
const fs = __importStar(require("fs"));
const whatsapp_engine_interface_1 = require("../interfaces/whatsapp-engine.interface");
const auth_dir_paths_1 = require("../auth-dir-paths");
class WwebjsStuckAuth {
    host;
    recoveryAttempted = false;
    constructor(host) {
        this.host = host;
    }
    async recoverFromStuckAuth() {
        const claim = this.host.getCallbacks().claimStuckAuthRecovery;
        let granted;
        if (claim) {
            try {
                granted = claim();
            }
            catch {
                granted = false;
            }
        }
        else {
            granted = !this.recoveryAttempted;
            this.recoveryAttempted = true;
        }
        if (!granted) {
            this.host.setStatus(whatsapp_engine_interface_1.EngineStatus.FAILED);
            this.host
                .getCallbacks()
                .onError?.('WhatsApp Web could not reach readiness after re-pairing. Pin WWEBJS_WEB_VERSION to a known-good build and try again.');
            return;
        }
        const client = this.host.getClient();
        this.host.setClient(null);
        try {
            const browser = client?.pupBrowser;
            browser?.process?.()?.kill?.('SIGKILL');
        }
        catch (err) {
            this.host.logger.warn('Could not kill the browser before clearing the saved session', {
                sessionId: this.host.config.sessionId,
                error: String(err),
            });
        }
        const removal = this.clearLocalAuth();
        this.host.getCallbacks().onCredentialTeardownStarted?.(removal);
        await removal;
        this.host.setStatus(whatsapp_engine_interface_1.EngineStatus.DISCONNECTED);
        this.host.getCallbacks().onDisconnected?.('Saved session could not be restored; cleared for re-pairing');
        if (typeof client?.destroy === 'function')
            void client.destroy().catch(() => undefined);
    }
    async clearLocalAuth() {
        const dir = (0, auth_dir_paths_1.wwjsAuthDir)(this.host.config.sessionDataPath, this.host.config.sessionId);
        await fs.promises
            .rm(dir, { recursive: true, force: true, maxRetries: 4 })
            .then(() => {
            this.host.logger.warn(`Deleted this session's stored WhatsApp credentials at ${dir}. That was the only copy, so the ` +
                'next start cannot restore the link and comes back with a fresh QR to scan.', { sessionId: this.host.config.sessionId, dir, action: 'auth_cleared' });
        })
            .catch((error) => {
            this.host.logger.warn(`Could not clear stale auth at ${dir}`, {
                sessionId: this.host.config.sessionId,
                dir,
                error: String(error),
            });
        });
    }
}
exports.WwebjsStuckAuth = WwebjsStuckAuth;
//# sourceMappingURL=wwebjs-stuck-auth.js.map