"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WwebjsOnboardingWatcher = exports.ONBOARDING_DEFAULT_CONTINUE_LABEL = void 0;
exports.resolveOnboardingContinueLabels = resolveOnboardingContinueLabels;
exports.probeOnboardingModal = probeOnboardingModal;
exports.collectDialogDiagnostics = collectDialogDiagnostics;
const whatsapp_engine_interface_1 = require("../interfaces/whatsapp-engine.interface");
exports.ONBOARDING_DEFAULT_CONTINUE_LABEL = 'Continue';
function resolveOnboardingContinueLabels() {
    const extra = (process.env.WWEBJS_ONBOARDING_CONTINUE_LABELS ?? '')
        .split(',')
        .map(label => label.replace(/\s+/g, ' ').trim())
        .filter(Boolean);
    return [exports.ONBOARDING_DEFAULT_CONTINUE_LABEL, ...extra];
}
function probeOnboardingModal(options) {
    const isVisible = (el) => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && el.offsetParent !== null;
    };
    const labels = options?.labels?.length ? options.labels : ['Continue'];
    const headingOptional = new Set(options?.headingOptionalFor ?? []);
    const heading = /what[’']?s new/i;
    const candidates = Array.from(document.querySelectorAll('button, [role="button"]'))
        .map(el => ({
        el,
        label: (el.textContent || '')
            .replace(/[\x00-\x1F\x7F]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim(),
    }))
        .filter(c => isVisible(c.el) && labels.includes(c.label));
    const insideDialog = (el) => {
        let scope = el.parentElement;
        for (let depth = 0; depth < 12 && scope; depth++, scope = scope.parentElement) {
            if (scope.getAttribute('role') === 'dialog' || scope.getAttribute('aria-modal') === 'true')
                return true;
        }
        return false;
    };
    for (const { el, label } of candidates.reverse()) {
        if (headingOptional.has(label)) {
            if (!insideDialog(el))
                continue;
            el.click();
            return { modalPresent: true, dismissed: true };
        }
        let scope = el;
        for (let depth = 0; depth < 8 && scope; depth++, scope = scope.parentElement) {
            if (!heading.test(scope.textContent || ''))
                continue;
            el.click();
            return { modalPresent: true, dismissed: true };
        }
    }
    return { modalPresent: false, dismissed: false };
}
function collectDialogDiagnostics() {
    const MAX_DIALOGS = 3;
    const MAX_BUTTONS_PER_DIALOG = 5;
    const ASSOCIATION_WALK = 12;
    const HEADING_TEXT_MAX = 80;
    const BUTTON_LABEL_MAX = 40;
    const clean = (text, max) => text
        .replace(/[\x00-\x1F\x7F]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, max);
    const isVisible = (el) => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && el.offsetParent !== null;
    };
    const within = (el, ancestor) => {
        let scope = el.parentElement;
        for (let depth = 0; depth < ASSOCIATION_WALK && scope; depth++, scope = scope.parentElement) {
            if (scope === ancestor)
                return true;
        }
        return false;
    };
    const dialogs = Array.from(document.querySelectorAll('[role="dialog"], [aria-modal="true"]'))
        .filter(isVisible)
        .slice(0, MAX_DIALOGS);
    if (dialogs.length === 0)
        return [];
    const headings = Array.from(document.querySelectorAll('[role="heading"], h1, h2, h3, h4, h5, h6')).filter(isVisible);
    const buttons = Array.from(document.querySelectorAll('button, [role="button"]')).filter(isVisible);
    return dialogs.map(dialog => {
        const headingEl = headings.find(h => within(h, dialog));
        const rawHeading = headingEl ? headingEl.textContent : dialog.getAttribute('aria-label');
        const heading = rawHeading ? clean(String(rawHeading), HEADING_TEXT_MAX) : '';
        const labels = buttons
            .filter(b => within(b, dialog))
            .map(b => clean(b.textContent || '', BUTTON_LABEL_MAX))
            .filter(label => label.length > 0)
            .slice(0, MAX_BUTTONS_PER_DIALOG);
        return { heading: heading || null, buttons: labels };
    });
}
const ONBOARDING_MODAL_INTERVAL_MS = 5_000;
const ONBOARDING_MODAL_MAX_LIFETIME_MS = 5 * 60_000;
const ONBOARDING_MODAL_PROBE_TIMEOUT_MS = 5_000;
const ONBOARDING_MODAL_MAX_DISMISS_CLICKS = 5;
class WwebjsOnboardingWatcher {
    host;
    onboardingWatcherTimer = null;
    onboardingWatcherStartedAt = 0;
    onboardingWatcherStarted = false;
    onboardingDismissClicks = 0;
    onboardingDialogSignatures = new Set();
    onboardingProbes = 0;
    constructor(host) {
        this.host = host;
    }
    startOnboardingWatcher() {
        if (this.onboardingWatcherStarted)
            return;
        this.onboardingWatcherStarted = true;
        this.onboardingWatcherStartedAt = Date.now();
        this.host.logger.debug('Onboarding modal watcher armed', {
            sessionId: this.host.config.sessionId,
            action: 'onboarding_watcher_started',
        });
        const tick = () => {
            if (!this.host.getClient() ||
                this.host.getStatus() !== whatsapp_engine_interface_1.EngineStatus.READY ||
                this.host.isTearingDown() ||
                this.host.isDisconnectReported()) {
                this.clearOnboardingWatcher();
                return;
            }
            if (Date.now() - this.onboardingWatcherStartedAt >= ONBOARDING_MODAL_MAX_LIFETIME_MS) {
                this.host.logger.debug('Onboarding modal watcher stopped at its lifetime cap', {
                    sessionId: this.host.config.sessionId,
                    probes: this.onboardingProbes,
                    clicks: this.onboardingDismissClicks,
                    dialogsSeen: this.onboardingDialogSignatures.size,
                    action: 'onboarding_watcher_stopped',
                });
                this.clearOnboardingWatcher();
                return;
            }
            this.onboardingWatcherTimer = setTimeout(tick, ONBOARDING_MODAL_INTERVAL_MS);
            this.onboardingWatcherTimer.unref?.();
            void this.dismissOnboardingModalIfNeeded();
        };
        this.onboardingWatcherTimer = setTimeout(tick, ONBOARDING_MODAL_INTERVAL_MS);
        this.onboardingWatcherTimer.unref?.();
    }
    clearOnboardingWatcher() {
        if (this.onboardingWatcherTimer) {
            clearTimeout(this.onboardingWatcherTimer);
            this.onboardingWatcherTimer = null;
        }
        this.onboardingWatcherStartedAt = 0;
    }
    async dismissOnboardingModalIfNeeded() {
        const client = this.host.getClient();
        if (!client)
            return;
        this.onboardingProbes += 1;
        const page = client.pupPage;
        const labels = resolveOnboardingContinueLabels();
        const headingOptionalFor = labels.filter(label => label !== exports.ONBOARDING_DEFAULT_CONTINUE_LABEL);
        let timeout;
        try {
            const result = await Promise.race([
                page?.evaluate(probeOnboardingModal, { labels, headingOptionalFor }),
                new Promise((_, reject) => {
                    timeout = setTimeout(() => reject(new Error('onboarding modal probe timed out')), ONBOARDING_MODAL_PROBE_TIMEOUT_MS);
                    timeout.unref?.();
                }),
            ]);
            if (result && result.dismissed === false) {
                const dialogs = await page?.evaluate(collectDialogDiagnostics);
                if (Array.isArray(dialogs) && dialogs.length > 0) {
                    const signature = JSON.stringify(dialogs);
                    if (!this.onboardingDialogSignatures.has(signature)) {
                        this.onboardingDialogSignatures.add(signature);
                        this.host.logger.warn('A visible dialog on WhatsApp Web matches neither the onboarding-modal heading nor a ' +
                            'confirm-button label. If this is the onboarding screen in another language, add its ' +
                            'confirm-button label to WWEBJS_ONBOARDING_CONTINUE_LABELS and restart OpenWA; on a ' +
                            'newly linked account WhatsApp unlinks the companion within minutes while it stays open. ' +
                            'An English onboarding screen that is not recognised is worth reporting.', {
                            sessionId: this.host.config.sessionId,
                            dialogs,
                            action: 'onboarding_dialog_unrecognized',
                        });
                    }
                }
            }
            if (!result?.dismissed)
                return;
            this.onboardingDismissClicks += 1;
            this.host.logger.log('Dismissed the WhatsApp Web onboarding modal', {
                sessionId: this.host.config.sessionId,
                attempt: this.onboardingDismissClicks,
                action: 'onboarding_modal_dismissed',
            });
            if (this.onboardingDismissClicks >= ONBOARDING_MODAL_MAX_DISMISS_CLICKS) {
                this.reportActionRequired(`WhatsApp is still showing its onboarding modal after ${this.onboardingDismissClicks} ` +
                    "attempts to dismiss it. Open WhatsApp Web on the account holder's own browser and click " +
                    'through the "What\'s new" screen, or the companion device will be unlinked. Then restart ' +
                    'the session (stop, then start) — acknowledging the modal does not return it to ready on its own.');
            }
        }
        catch {
            this.host.logger.debug('Onboarding modal probe could not reach the page; ignoring', {
                sessionId: this.host.config.sessionId,
                action: 'onboarding_modal_probe_skipped',
            });
        }
        finally {
            if (timeout)
                clearTimeout(timeout);
        }
    }
    reportActionRequired(reason) {
        this.clearOnboardingWatcher();
        if (this.host.getStatus() !== whatsapp_engine_interface_1.EngineStatus.READY) {
            this.host.logger.debug('Onboarding modal fallback superseded by a status change; not moving to ACTION_REQUIRED', {
                sessionId: this.host.config.sessionId,
                status: this.host.getStatus(),
                action: 'onboarding_action_required_suppressed',
            });
            return;
        }
        this.host.setStatus(whatsapp_engine_interface_1.EngineStatus.ACTION_REQUIRED);
        this.host.getCallbacks().onActionRequired?.(reason);
        this.host.logger.warn(reason, { sessionId: this.host.config.sessionId, action: 'onboarding_modal_fallback' });
    }
}
exports.WwebjsOnboardingWatcher = WwebjsOnboardingWatcher;
//# sourceMappingURL=wwebjs-onboarding.js.map