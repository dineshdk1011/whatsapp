"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WwebjsReadyReconcile = exports.READY_RECONCILE_BRIDGE_RELOAD_GRACE_MS = exports.READY_RECONCILE_TIMEOUT_MS = void 0;
const whatsapp_web_js_1 = require("whatsapp-web.js");
const whatsapp_engine_interface_1 = require("../interfaces/whatsapp-engine.interface");
const READY_RECONCILE_INTERVAL_MS = 2000;
exports.READY_RECONCILE_TIMEOUT_MS = 90_000;
exports.READY_RECONCILE_BRIDGE_RELOAD_GRACE_MS = 45_000;
class WwebjsReadyReconcile {
    host;
    readyReconcileTimer = null;
    readyReconcileStartedAt = 0;
    readyReconcileProbeInFlight = false;
    lastProbeStateConnected = false;
    readyReconcileReloadAttempted = false;
    constructor(host) {
        this.host = host;
    }
    scheduleReadyReconcile() {
        this.clearReadyReconcile();
        this.readyReconcileStartedAt = Date.now();
        const tick = () => {
            if (!this.host.getClient() || this.host.getStatus() !== whatsapp_engine_interface_1.EngineStatus.AUTHENTICATING) {
                this.clearReadyReconcile();
                return;
            }
            if (Date.now() - this.readyReconcileStartedAt >= exports.READY_RECONCILE_TIMEOUT_MS) {
                const bridgeDead = (this.lastProbeStateConnected || this.readyReconcileReloadAttempted) &&
                    this.host.getClient()?.eventsAttached === false;
                if (bridgeDead) {
                    this.host.logger.error('WhatsApp Web stayed connected but its event bridge never attached within the readiness ' +
                        'deadline — inbound messages would be silently lost, so the session is marked failed. ' +
                        'The saved credentials were kept; restart the session to relaunch the browser.', undefined, { sessionId: this.host.config.sessionId, action: 'ready_reconcile_bridge_dead' });
                    this.clearReadyReconcile();
                    this.host.setStatus(whatsapp_engine_interface_1.EngineStatus.FAILED);
                    this.host
                        .getCallbacks()
                        .onError?.('WhatsApp Web is connected but its event bridge never attached, so inbound messages would be ' +
                        'lost. The saved session was kept — restart the session to relaunch the browser.');
                    return;
                }
                if (!this.host.wasFreshPairing()) {
                    this.host.logger.error('WhatsApp Web restored the saved session but it never became ready within the readiness ' +
                        'deadline; the session is marked failed and the saved credentials were kept.', undefined, { sessionId: this.host.config.sessionId, action: 'ready_reconcile_timeout_restored' });
                    this.clearReadyReconcile();
                    this.host.setStatus(whatsapp_engine_interface_1.EngineStatus.FAILED);
                    this.host
                        .getCallbacks()
                        .onError?.('WhatsApp Web restored the saved session but never became ready; the saved credentials were kept. ' +
                        'Restart the session; to pair again, delete it (which clears the saved credentials) and create ' +
                        'it anew. Pin WWEBJS_WEB_VERSION if it keeps recurring.');
                    return;
                }
                this.host.logger.warn('Timed out waiting for WhatsApp Web runtime readiness after authentication — the saved session ' +
                    'is stuck after the QR scan (usually the auto-selected WhatsApp Web build is incompatible). ' +
                    'Clearing it to re-pair; pin a known-good version via WWEBJS_WEB_VERSION (see ' +
                    'docs/12-troubleshooting-faq.md) if it keeps recurring.', { sessionId: this.host.config.sessionId, action: 'ready_reconcile_timeout' });
                this.clearReadyReconcile();
                void this.host.recoverFromStuckAuth();
                return;
            }
            this.readyReconcileTimer = setTimeout(tick, READY_RECONCILE_INTERVAL_MS);
            this.readyReconcileTimer.unref?.();
            if (this.readyReconcileProbeInFlight)
                return;
            this.readyReconcileProbeInFlight = true;
            void this.isClientRuntimeReady()
                .then(ready => {
                if (ready && this.host.getClient() && this.host.getStatus() === whatsapp_engine_interface_1.EngineStatus.AUTHENTICATING) {
                    this.host.logger.warn('WhatsApp Web ready event was missed; reconciling from connected runtime state');
                    this.host.markReadyFromClientInfo();
                }
                else if (this.host.getStatus() === whatsapp_engine_interface_1.EngineStatus.AUTHENTICATING) {
                    this.maybeReloadDeadBridge();
                }
            })
                .catch(error => this.host.logger.debug('Ready reconciliation probe failed', { error: String(error) }))
                .finally(() => {
                this.readyReconcileProbeInFlight = false;
            });
        };
        this.readyReconcileTimer = setTimeout(tick, READY_RECONCILE_INTERVAL_MS);
        this.readyReconcileTimer.unref?.();
    }
    clearReadyReconcile() {
        if (this.readyReconcileTimer) {
            clearTimeout(this.readyReconcileTimer);
            this.readyReconcileTimer = null;
        }
        this.readyReconcileStartedAt = 0;
        this.readyReconcileProbeInFlight = false;
        this.lastProbeStateConnected = false;
        this.readyReconcileReloadAttempted = false;
    }
    client() {
        return this.host.getClient();
    }
    async isClientRuntimeReady() {
        if (!this.client())
            return false;
        const connected = (await this.client().getState()) === whatsapp_web_js_1.WAState.CONNECTED;
        this.lastProbeStateConnected = connected;
        if (!connected)
            return false;
        if (!this.client()?.info?.wid?.user)
            return false;
        if (this.client()?.eventsAttached === false)
            return false;
        const page = this.client().pupPage;
        const hasWWebJS = await page?.evaluate(() => typeof window.WWebJS !== 'undefined');
        return hasWWebJS === true;
    }
    maybeReloadDeadBridge() {
        if (this.readyReconcileReloadAttempted)
            return;
        const client = this.host.getClient();
        if (!client || !this.lastProbeStateConnected)
            return;
        if (client.eventsAttached !== false)
            return;
        if (Date.now() - this.readyReconcileStartedAt < exports.READY_RECONCILE_BRIDGE_RELOAD_GRACE_MS)
            return;
        this.readyReconcileReloadAttempted = true;
        this.host.logger.warn('WhatsApp Web is connected but its event bridge never attached; reloading the page to reinject', {
            sessionId: this.host.config.sessionId,
            action: 'event_bridge_reload',
        });
        const page = client.pupPage;
        void page?.reload?.()?.catch((error) => this.host.logger.warn('Event-bridge reload failed', {
            sessionId: this.host.config.sessionId,
            error: String(error),
        }));
    }
}
exports.WwebjsReadyReconcile = WwebjsReadyReconcile;
//# sourceMappingURL=wwebjs-reconcile.js.map