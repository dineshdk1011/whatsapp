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
exports.WwebjsLifecycle = exports.NAVIGATION_EPISODE_CAP_MS = exports.NAVIGATION_REINJECT_GRACE_MS = exports.PAIRING_CODE_RETRY_DELAY_MS = exports.PAIRING_CODE_ATTEMPT_TIMEOUT_MS = exports.PAIRING_CODE_MAX_ATTEMPTS = exports.CAPTURED_PAGE_ERROR_PREFIX = exports.PAGE_RELOADING_MESSAGE = void 0;
exports.isExecutionContextDestroyedError = isExecutionContextDestroyedError;
exports.isProtocolTimeout = isProtocolTimeout;
exports.isNavigationError = isNavigationError;
exports.toCapturedPageError = toCapturedPageError;
const qrcode = __importStar(require("qrcode"));
const path = __importStar(require("path"));
const common_1 = require("@nestjs/common");
const whatsapp_web_js_1 = require("whatsapp-web.js");
const whatsapp_engine_interface_1 = require("../interfaces/whatsapp-engine.interface");
const engine_not_ready_error_1 = require("../../common/errors/engine-not-ready.error");
const engine_transport_error_1 = require("../../common/errors/engine-transport.error");
const engine_page_error_1 = require("../../common/errors/engine-page.error");
const configuration_1 = require("../../config/configuration");
const wa_web_version_1 = require("../wa-web-version");
const engine_init_timeout_1 = require("../engine-init-timeout");
const chromium_profile_hygiene_1 = require("./chromium-profile-hygiene");
const wwebjs_proxy_1 = require("./wwebjs-proxy");
const wwebjs_backport_check_1 = require("./wwebjs-backport-check");
const engine_patch_status_1 = require("./engine-patch-status");
const wwebjs_call_hook_check_1 = require("./wwebjs-call-hook-check");
const wwebjs_running_build_1 = require("./wwebjs-running-build");
const terminal_engine_failure_1 = require("../terminal-engine-failure");
const auth_dir_paths_1 = require("../auth-dir-paths");
function isExecutionContextDestroyedError(reason) {
    return /execution context was destroyed/i.test(reason);
}
function isNavigationShapedInitRejection(reason) {
    return isExecutionContextDestroyedError(reason) || /window\.require is not a function/i.test(reason);
}
const PROTOCOL_TIMEOUT_PATTERN = /timed out\. increase the 'protocoltimeout'/i;
function isProtocolTimeout(error) {
    if (error instanceof common_1.HttpException) {
        return false;
    }
    return PROTOCOL_TIMEOUT_PATTERN.test(error instanceof Error ? error.message : String(error));
}
exports.PAGE_RELOADING_MESSAGE = 'WhatsApp Web is reloading its page and the session is re-injecting. Retry in a few seconds.';
function isNavigationError(error) {
    if (error instanceof common_1.HttpException) {
        return false;
    }
    const message = error instanceof Error ? error.message : String(error);
    return !message.startsWith(exports.CAPTURED_PAGE_ERROR_PREFIX) && isNavigationShapedInitRejection(message);
}
exports.CAPTURED_PAGE_ERROR_PREFIX = 'page threw ';
const EMPTY_SUMMARY_FIELD = new Set(['', 'undefined', 'null', '(unreadable)']);
function toCapturedPageError(error) {
    if (!(error instanceof Error) || !error.message.startsWith(exports.CAPTURED_PAGE_ERROR_PREFIX))
        return error;
    let info;
    try {
        info = JSON.parse(error.message.slice(exports.CAPTURED_PAGE_ERROR_PREFIX.length));
    }
    catch {
        return error;
    }
    if (!info || typeof info !== 'object')
        return error;
    const pick = (...keys) => {
        for (const key of keys) {
            const value = info[key];
            if (typeof value === 'string' && !EMPTY_SUMMARY_FIELD.has(value))
                return value;
        }
        return '';
    };
    const build = pick('build');
    return new engine_page_error_1.EnginePageError({ name: pick('name', 'ctor') || 'Error', message: pick('message', 'str'), ...(build ? { build } : {}) }, error);
}
exports.PAIRING_CODE_MAX_ATTEMPTS = 4;
exports.PAIRING_CODE_ATTEMPT_TIMEOUT_MS = 15_000;
exports.PAIRING_CODE_RETRY_DELAY_MS = 3_000;
class PairingCodeAttemptTimeoutError extends Error {
    constructor() {
        super('requestPairingCode attempt timed out');
        this.name = 'PairingCodeAttemptTimeoutError';
    }
}
exports.NAVIGATION_REINJECT_GRACE_MS = 60_000;
exports.NAVIGATION_EPISODE_CAP_MS = 3 * exports.NAVIGATION_REINJECT_GRACE_MS;
const PREVIOUS_PAGE_READY_MS = 5_000;
const INIT_RETRY_MIN_REMAINING_MS = 20_000;
const WA_STATE_RESTRICTIONS = {
    TOS_BLOCK: 'tos_block',
    SMB_TOS_BLOCK: 'tos_block',
    PROXYBLOCK: 'proxy_block',
};
class WwebjsLifecycle {
    host;
    client = null;
    status = whatsapp_engine_interface_1.EngineStatus.DISCONNECTED;
    qrCode = null;
    phoneNumber = null;
    pushName = null;
    tearingDown = false;
    logoutInitiated = false;
    credentialTeardownStarted = false;
    disconnectReported = false;
    qrShown = false;
    lastMainFrameNavigationAt = 0;
    navigationEpisodeStartedAt = 0;
    navigationCount = 0;
    reinjectUnverifiedSince = 0;
    latestNavigationAt = 0;
    lastReadyAt = 0;
    helpersMissingProbeAt = 0;
    pageWithoutHelpers = false;
    requestedWebVersion;
    constructor(host) {
        this.host = host;
    }
    async initialize() {
        this.setStatus(whatsapp_engine_interface_1.EngineStatus.INITIALIZING);
        const initStartedAt = Date.now();
        const backportProblemText = (0, wwebjs_backport_check_1.backportProblem)();
        if (backportProblemText) {
            this.host.logger.error(backportProblemText);
        }
        const unapplied = (0, engine_patch_status_1.unappliedPatches)('wwebjs');
        if (unapplied.length) {
            this.host.logger.error((0, engine_patch_status_1.unappliedPatchesMessage)('wwebjs', unapplied));
        }
        try {
            const puppeteerArgs = this.host.config.puppeteer?.args
                ? [...this.host.config.puppeteer.args]
                : (0, configuration_1.withPinnedBrowserLocale)(configuration_1.DEFAULT_PUPPETEER_ARGS);
            let proxyAuthentication;
            if (this.host.config.proxy) {
                if ((0, wwebjs_proxy_1.isSupportedProxyUrl)(this.host.config.proxy.url)) {
                    const proxyLaunch = (0, wwebjs_proxy_1.buildProxyLaunchConfig)(this.host.config.proxy.url);
                    puppeteerArgs.push(`--proxy-server=${proxyLaunch.serverArg}`);
                    proxyAuthentication = proxyLaunch.proxyAuthentication;
                    if (proxyLaunch.socksAuthUnsupported) {
                        this.host.logger.warn(`Proxy for session ${this.host.config.sessionId} has credentials on a SOCKS proxy, but Chromium ` +
                            `cannot authenticate SOCKS proxies. Use an IP-authorized proxy or an HTTP/HTTPS proxy instead.`);
                    }
                    this.host.logger.log(`Using proxy: ${proxyLaunch.serverArg}`);
                }
                else {
                    throw new Error(`The session proxy URL is not a supported http(s)/socks4/socks5 URL; fix or clear it with ` +
                        `PATCH /api/sessions/${this.host.config.sessionId}/proxy`);
                }
            }
            puppeteerArgs.push(`--openwa-session=${this.host.config.sessionId}`);
            const versionPin = await (0, wa_web_version_1.resolveWebVersionPin)(undefined, path.join(path.resolve(this.host.config.sessionDataPath), '.wa-web-cache'));
            this.requestedWebVersion = versionPin?.webVersion;
            if (this.tearingDown) {
                this.setStatus(whatsapp_engine_interface_1.EngineStatus.DISCONNECTED);
                return;
            }
            if (versionPin) {
                this.host.logger.log(`Pinning WhatsApp Web version ${versionPin.webVersion}`);
            }
            const authTimeoutMs = (0, engine_init_timeout_1.resolveAuthTimeoutMs)();
            if (authTimeoutMs) {
                this.host.logger.log(`Using auth timeout ${authTimeoutMs}ms`);
            }
            try {
                await this.runInitAttempt(puppeteerArgs, authTimeoutMs, proxyAuthentication, versionPin);
            }
            catch (attemptError) {
                const attemptReason = attemptError instanceof Error ? attemptError.message : String(attemptError);
                const budgetLeftMs = (0, engine_init_timeout_1.resolveEngineInitTimeoutMs)() - (Date.now() - initStartedAt);
                if (this.tearingDown ||
                    !isNavigationShapedInitRejection(attemptReason) ||
                    budgetLeftMs < INIT_RETRY_MIN_REMAINING_MS) {
                    throw attemptError;
                }
                this.host.logger.warn(`"${attemptReason}" killed the first inject — a page navigation landed before ` +
                    `whatsapp-web.js installed its re-inject handler. Retrying the launch once (#1081).`, { sessionId: this.host.config.sessionId, action: 'init_navigation_retry' });
                const cleaned = await this.resetForInitRetry();
                if (this.tearingDown) {
                    this.setStatus(whatsapp_engine_interface_1.EngineStatus.DISCONNECTED);
                    return;
                }
                if (!cleaned) {
                    this.host.logger.warn("Attempt 1's browser did not die within the destroy bound — abandoning the retry rather " +
                        'than launching a second Chromium into the same profile', { sessionId: this.host.config.sessionId, action: 'init_navigation_retry_abandoned' });
                    throw attemptError;
                }
                await this.runInitAttempt(puppeteerArgs, authTimeoutMs, proxyAuthentication, versionPin);
            }
        }
        catch (error) {
            if (this.tearingDown) {
                if (this.status !== whatsapp_engine_interface_1.EngineStatus.DISCONNECTED)
                    this.setStatus(whatsapp_engine_interface_1.EngineStatus.DISCONNECTED);
                return;
            }
            this.setStatus(whatsapp_engine_interface_1.EngineStatus.FAILED);
            const reason = error instanceof Error ? error.message : String(error);
            let surfacedReason = reason;
            if (isExecutionContextDestroyedError(reason)) {
                this.host.logger.warn(`"${reason}" during initialize. If this followed an OpenWA upgrade that changed the ` +
                    `Chromium/Chrome binary (v0.8.12 amd64 switched Debian Chromium → Chrome for Testing), the ` +
                    `session's browser profile is likely stale — delete the profile dir ` +
                    `"${(0, auth_dir_paths_1.wwjsAuthDir)(this.host.config.sessionDataPath, this.host.config.sessionId)}" ` +
                    `and start again to re-scan. If no upgrade happened, Puppeteer also raises this on a page ` +
                    `navigation or renderer crash (check for memory pressure or a WhatsApp Web reload). ` +
                    `See docs/12-troubleshooting-faq.md.`);
                surfacedReason =
                    `${reason} ${terminal_engine_failure_1.STALE_PROFILE_ADVICE} If this followed an ` +
                        `upgrade, the session's browser profile is likely stale — see docs/12-troubleshooting-faq.md.`;
            }
            this.host.getCallbacks().onError?.(surfacedReason);
            throw error;
        }
    }
    async runInitAttempt(puppeteerArgs, authTimeoutMs, proxyAuthentication, versionPin) {
        const configuredProtocolTimeout = this.host.config.puppeteer?.protocolTimeoutMs;
        const protocolTimeout = typeof configuredProtocolTimeout === 'number' &&
            configuredProtocolTimeout > 0 &&
            configuredProtocolTimeout <= configuration_1.MAX_TIMER_MS
            ? configuredProtocolTimeout
            : undefined;
        const client = new whatsapp_web_js_1.Client({
            authStrategy: new whatsapp_web_js_1.LocalAuth({
                clientId: this.host.config.sessionId,
                dataPath: path.resolve(this.host.config.sessionDataPath),
            }),
            puppeteer: {
                headless: this.host.config.puppeteer?.headless ?? true,
                args: puppeteerArgs,
                handleSIGINT: false,
                handleSIGTERM: false,
                handleSIGHUP: false,
                ...(this.host.config.puppeteer?.executablePath
                    ? { executablePath: this.host.config.puppeteer.executablePath }
                    : {}),
                ...(protocolTimeout !== undefined ? { protocolTimeout } : {}),
            },
            ...(authTimeoutMs !== undefined ? { authTimeoutMs } : {}),
            ...(proxyAuthentication ? { proxyAuthentication } : {}),
            ...(versionPin ?? { webVersionCache: { type: 'none' } }),
        });
        this.client = client;
        this.setupEventHandlers();
        if (this.tearingDown) {
            this.client = null;
            this.setStatus(whatsapp_engine_interface_1.EngineStatus.DISCONNECTED);
            return;
        }
        await (0, chromium_profile_hygiene_1.killOrphanedChromiumProcesses)(this.host.config.sessionId, this.host.logger);
        await (0, chromium_profile_hygiene_1.removeStaleSingletonFiles)(this.host.config.sessionId, this.host.config.sessionDataPath, this.host.logger);
        if (this.tearingDown)
            return;
        try {
            await client.initialize();
        }
        finally {
            if (this.tearingDown || this.client !== client) {
                await client.destroy().catch(() => undefined);
            }
        }
        if (this.tearingDown || this.client !== client)
            return;
        this.reportFailedReinjects(client);
        this.attachPuppeteerLifecycleListeners();
    }
    reportFailedReinjects(client) {
        const target = client;
        const inject = target.inject;
        if (typeof inject !== 'function')
            return;
        target.inject = () => inject.call(client).catch((error) => {
            if (this.tearingDown || this.disconnectReported || this.client !== client)
                return;
            this.host.logger.warn('whatsapp-web.js could not re-inject into the reloaded WhatsApp Web page', {
                sessionId: this.host.config.sessionId,
                error: error instanceof Error ? error.message : String(error),
                action: 'page_reinject_failed',
            });
        });
    }
    async resetForInitRetry() {
        const failed = this.client;
        this.client = null;
        this.host.clearReadyReconcile();
        this.qrCode = null;
        this.setStatus(whatsapp_engine_interface_1.EngineStatus.INITIALIZING);
        if (!failed)
            return true;
        failed.removeAllListeners();
        let timeout;
        try {
            await Promise.race([
                failed.destroy(),
                new Promise((_, reject) => {
                    timeout = setTimeout(() => reject(new Error('init-retry destroy timed out')), 5_000);
                    timeout.unref?.();
                }),
            ]);
            return true;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.host.logger.warn('Destroying the failed first init attempt did not complete cleanly', {
                error: message,
            });
            return message !== 'init-retry destroy timed out';
        }
        finally {
            if (timeout)
                clearTimeout(timeout);
        }
    }
    setupEventHandlers() {
        if (!this.client)
            return;
        const source = this.client;
        const canPublishQr = () => this.client === source &&
            !this.tearingDown &&
            !this.disconnectReported &&
            ![whatsapp_engine_interface_1.EngineStatus.AUTHENTICATING, whatsapp_engine_interface_1.EngineStatus.READY, whatsapp_engine_interface_1.EngineStatus.ACTION_REQUIRED, whatsapp_engine_interface_1.EngineStatus.FAILED].includes(this.getStatus());
        this.client.on('qr', async (qr) => {
            if (!canPublishQr())
                return;
            this.qrShown = true;
            try {
                const encodedQr = await qrcode.toDataURL(qr);
                if (!canPublishQr())
                    return;
                this.qrCode = encodedQr;
                this.setStatus(whatsapp_engine_interface_1.EngineStatus.QR_READY);
                this.host.getCallbacks().onQRCode?.(this.qrCode);
            }
            catch (error) {
                this.host.logger.error('Error generating QR code', String(error));
            }
        });
        this.client.on('authenticated', () => {
            if (this.client !== source ||
                this.tearingDown ||
                this.disconnectReported ||
                this.status === whatsapp_engine_interface_1.EngineStatus.AUTHENTICATING ||
                this.status === whatsapp_engine_interface_1.EngineStatus.READY ||
                this.status === whatsapp_engine_interface_1.EngineStatus.ACTION_REQUIRED ||
                this.status === whatsapp_engine_interface_1.EngineStatus.FAILED) {
                return;
            }
            this.setStatus(whatsapp_engine_interface_1.EngineStatus.AUTHENTICATING);
            this.qrCode = null;
            this.host.scheduleReadyReconcile();
        });
        this.client.on('ready', () => {
            if (this.client !== source || this.tearingDown || this.disconnectReported)
                return;
            this.clearNavigationReinjectWindow();
            this.lastReadyAt = Date.now();
            if (this.reinjectUnverifiedSince !== 0) {
                const navigationsBefore = this.navigationCount;
                void this.pageHasWwebjsHelpers(source).then(found => {
                    if (found && this.client === source && !this.tearingDown && !this.disconnectReported) {
                        this.closeRecoveredEpisode(navigationsBefore);
                    }
                }, () => undefined);
            }
            if (source.eventsAttached === false) {
                this.host.logger.warn('Ignoring premature ready: the message event bridge is not attached yet', {
                    sessionId: this.host.config.sessionId,
                    action: 'premature_ready_ignored',
                });
                return;
            }
            this.markReadyFromClientInfo();
        });
        this.host.attachDomainEvents(this.client);
        this.client.on('disconnected', reason => {
            if (reason === 'LOGOUT' && !this.logoutInitiated && !this.credentialTeardownStarted) {
                this.credentialTeardownStarted = true;
                this.host.getCallbacks().onCredentialTeardownStarted?.(this.host.clearLocalAuth());
            }
            if (this.tearingDown || this.disconnectReported)
                return;
            this.host.clearReadyReconcile();
            if (reason === 'LOGOUT') {
                this.host.logger.warn('WhatsApp unlinked this device (LOGOUT). whatsapp-web.js is deleting the stored credentials ' +
                    'for this session, so reconnecting cannot restore the link — the session comes back with a ' +
                    'fresh QR and must be re-scanned. If this was not expected, check Linked devices on the phone.');
            }
            this.setStatus(whatsapp_engine_interface_1.EngineStatus.DISCONNECTED);
            const restriction = WA_STATE_RESTRICTIONS[reason];
            if (restriction) {
                this.host.getCallbacks().onAccountRestriction?.({ kind: restriction, code: reason });
            }
            this.host.getCallbacks().onDisconnected?.(reason);
        });
        this.client.on('auth_failure', (message) => {
            this.host.clearReadyReconcile();
            this.setStatus(whatsapp_engine_interface_1.EngineStatus.FAILED);
            this.host.getCallbacks().onError?.(message ? `${terminal_engine_failure_1.AUTH_FAILURE_REASON}: ${message}` : terminal_engine_failure_1.AUTH_FAILURE_REASON);
        });
    }
    attachPuppeteerLifecycleListeners() {
        if (!this.client)
            return;
        const { pupBrowser, pupPage } = this.client;
        pupBrowser?.on('disconnected', () => this.handlePuppeteerDeath('Browser process closed or crashed'));
        pupPage?.on('error', () => this.handlePuppeteerDeath('Page crashed'));
        pupPage?.on('close', () => this.handlePuppeteerDeath('Page closed'));
        pupPage?.on('framenavigated', frame => {
            try {
                if (typeof pupPage.mainFrame === 'function' && frame !== pupPage.mainFrame())
                    return;
                if (typeof frame?.url === 'function' && frame.url().includes('post_logout=1'))
                    return;
            }
            catch {
                return;
            }
            if (this.client?.lastLoggedOut)
                return;
            this.navigationCount++;
            const now = Date.now();
            const replacedPageReinjected = this.lastReadyAt - this.latestNavigationAt >= PREVIOUS_PAGE_READY_MS;
            this.latestNavigationAt = now;
            this.pageWithoutHelpers = false;
            if (this.navigationEpisodeStartedAt === 0)
                this.navigationEpisodeStartedAt = now;
            this.lastMainFrameNavigationAt = now;
            const ready = this.status === whatsapp_engine_interface_1.EngineStatus.READY || this.status === whatsapp_engine_interface_1.EngineStatus.ACTION_REQUIRED;
            if (ready && (this.reinjectUnverifiedSince === 0 || replacedPageReinjected))
                this.reinjectUnverifiedSince = now;
            this.host.logger.warn('Page navigated; whatsapp-web.js is re-injecting', {
                sessionId: this.host.config.sessionId,
                action: 'page_navigation_reinject_window',
                graced: this.isInNavigationReinjectWindow(),
            });
        });
    }
    handlePuppeteerDeath(reason) {
        if (this.tearingDown ||
            !this.client ||
            this.status === whatsapp_engine_interface_1.EngineStatus.DISCONNECTED ||
            this.status === whatsapp_engine_interface_1.EngineStatus.FAILED) {
            return;
        }
        this.host.clearReadyReconcile();
        this.setStatus(whatsapp_engine_interface_1.EngineStatus.DISCONNECTED);
        this.host.getCallbacks().onDisconnected?.(reason);
    }
    static PAGE_GONE_POLLS = 25;
    static PAGE_GONE_POLL_MS = 20;
    static PAGE_TRANSPORT_ERROR_PATTERN = /protocol error|target closed|targetclosederror|detached frame|session closed|connection closed/i;
    isPageTransportError(error) {
        if (error instanceof common_1.HttpException) {
            return false;
        }
        if (isProtocolTimeout(error)) {
            return false;
        }
        const message = error instanceof Error ? error.message : String(error);
        if (message.startsWith(exports.CAPTURED_PAGE_ERROR_PREFIX)) {
            return false;
        }
        return WwebjsLifecycle.PAGE_TRANSPORT_ERROR_PATTERN.test(message);
    }
    reportIfPageTransportError(error, context) {
        if (!this.isPageTransportError(error)) {
            return;
        }
        this.reportDeath(error, context);
    }
    async reportOnceGone(error, context) {
        if (!this.isPageTransportError(error))
            return;
        for (let polls = 0; polls < WwebjsLifecycle.PAGE_GONE_POLLS; polls++) {
            if (this.status !== whatsapp_engine_interface_1.EngineStatus.READY || this.isPageGone())
                break;
            await new Promise(resolve => setTimeout(resolve, WwebjsLifecycle.PAGE_GONE_POLL_MS));
        }
        if (this.status !== whatsapp_engine_interface_1.EngineStatus.READY)
            return;
        if (!this.isPageGone()) {
            this.host.logger.warn(`Page transport error during ${context} while the page is alive, not a death`, {
                error: error instanceof Error ? error.message : String(error),
                action: 'page_transport_error_page_alive',
            });
            return;
        }
        this.reportDeath(error, context);
    }
    reportDeath(error, context) {
        if (this.isInNavigationReinjectWindow()) {
            this.host.logger.warn(`Page transport error during ${context} inside the navigation re-inject window — not a death`, {
                error: error instanceof Error ? error.message : String(error),
                action: 'page_transport_error_graced',
            });
            return;
        }
        this.host.logger.warn(`Page transport error during ${context} — treating the session as dead`, {
            error: error instanceof Error ? error.message : String(error),
        });
        this.handlePuppeteerDeath(`Page transport error during ${context}`);
    }
    isPageGone() {
        const { pupBrowser, pupPage } = (this.client ?? {});
        return pupPage?.isClosed?.() === true || pupBrowser?.connected === false;
    }
    markReadyFromClientInfo() {
        if ([whatsapp_engine_interface_1.EngineStatus.READY, whatsapp_engine_interface_1.EngineStatus.DISCONNECTED, whatsapp_engine_interface_1.EngineStatus.FAILED, whatsapp_engine_interface_1.EngineStatus.ACTION_REQUIRED].includes(this.status))
            return;
        this.host.clearReadyReconcile();
        try {
            const info = this.client?.info;
            this.phoneNumber = info?.wid?.user || null;
            this.pushName = info?.pushname || null;
            this.setStatus(whatsapp_engine_interface_1.EngineStatus.READY);
            this.host.getCallbacks().onReady?.(this.phoneNumber || '', this.pushName || '');
        }
        catch (error) {
            this.host.logger.error('Error getting client info', String(error));
            this.setStatus(whatsapp_engine_interface_1.EngineStatus.READY);
            this.host.getCallbacks().onReady?.('', '');
        }
        this.host.startOnboardingWatcher();
        const page = this.client?.pupPage;
        if (!(0, engine_patch_status_1.unappliedPatches)('wwebjs').includes('patch-wwebjs-ready-sync')) {
            void (0, wwebjs_call_hook_check_1.reportMissingCallHook)(page, this.host.logger, this.host.config.sessionId);
        }
        void (0, wwebjs_running_build_1.reportRunningWebBuild)(page, this.host.logger, this.host.config.sessionId, this.requestedWebVersion);
    }
    setStatus(status) {
        if (status === whatsapp_engine_interface_1.EngineStatus.DISCONNECTED) {
            this.disconnectReported = true;
        }
        if (status !== whatsapp_engine_interface_1.EngineStatus.QR_READY) {
            this.qrCode = null;
        }
        this.status = status;
        this.host.getCallbacks().onStateChanged?.(status);
    }
    beginClientTeardown() {
        this.tearingDown = true;
        this.host.clearLiveCalls();
        this.clearNavigationReinjectWindow();
        this.reinjectUnverifiedSince = 0;
        this.pageWithoutHelpers = false;
        const client = this.client;
        if (!client)
            return null;
        this.host.clearReadyReconcile();
        this.host.clearOnboardingWatcher();
        if (this.status !== whatsapp_engine_interface_1.EngineStatus.DISCONNECTED) {
            this.setStatus(whatsapp_engine_interface_1.EngineStatus.DISCONNECTED);
        }
        return client;
    }
    finishClientTeardown(client) {
        if (this.client === client) {
            this.client = null;
        }
        this.host.clearReadyReconcile();
        this.host.clearOnboardingWatcher();
        this.clearNavigationReinjectWindow();
    }
    async disconnect() {
        const client = this.beginClientTeardown();
        if (!client)
            return;
        try {
            await client.destroy();
        }
        catch (error) {
            this.host.logger.warn('Destroy client failed:', { error: String(error) });
        }
        finally {
            this.finishClientTeardown(client);
        }
    }
    async logout() {
        this.logoutInitiated = true;
        const client = this.beginClientTeardown();
        if (!client) {
            throw new Error('No live WhatsApp Web client — the unlink was not sent');
        }
        try {
            await client.logout();
        }
        catch (error) {
            this.host.logger.warn('Logout failed:', { error: String(error) });
            try {
                await client.destroy();
            }
            catch (destroyError) {
                this.host.logger.warn('Client destroy also failed during logout fallback', { error: String(destroyError) });
            }
            throw error;
        }
        finally {
            this.finishClientTeardown(client);
        }
    }
    async destroy() {
        const client = this.beginClientTeardown();
        if (!client)
            return;
        try {
            await client.destroy();
        }
        finally {
            this.finishClientTeardown(client);
        }
    }
    async forceDestroy() {
        const client = this.beginClientTeardown();
        if (!client)
            return;
        try {
            const proc = client.pupBrowser?.process?.();
            proc?.kill?.('SIGKILL');
        }
        catch (err) {
            this.host.logger.warn('forceDestroy: failed to kill the browser process', { error: String(err) });
        }
        try {
            await client.destroy();
        }
        catch (err) {
            this.host.logger.warn('forceDestroy: client.destroy() failed after the kill (continuing)', {
                error: String(err),
            });
        }
        finally {
            this.finishClientTeardown(client);
        }
    }
    getStatus() {
        return this.status;
    }
    getQRCode() {
        return this.qrCode;
    }
    getPhoneNumber() {
        return this.phoneNumber;
    }
    getPushName() {
        return this.pushName;
    }
    isInNavigationReinjectWindow() {
        if (this.lastMainFrameNavigationAt === 0)
            return false;
        const now = Date.now();
        return (now - this.lastMainFrameNavigationAt < exports.NAVIGATION_REINJECT_GRACE_MS &&
            now - this.navigationEpisodeStartedAt < exports.NAVIGATION_EPISODE_CAP_MS);
    }
    isPageWithoutHelpers() {
        return this.pageWithoutHelpers;
    }
    clearNavigationReinjectWindow() {
        this.lastMainFrameNavigationAt = 0;
        this.navigationEpisodeStartedAt = 0;
    }
    async probeLiveness() {
        const probeable = this.status === whatsapp_engine_interface_1.EngineStatus.READY || this.status === whatsapp_engine_interface_1.EngineStatus.ACTION_REQUIRED;
        if (!probeable || !this.client)
            return false;
        const navigationsBefore = this.navigationCount;
        const startedAt = Date.now();
        const client = this.client;
        let connected = false;
        let helpersPending = false;
        const probe = async () => {
            if ((await client.getState()) !== whatsapp_web_js_1.WAState.CONNECTED)
                return false;
            connected = true;
            if (this.reinjectUnverifiedSince === 0)
                return true;
            helpersPending = true;
            let found;
            try {
                found = await this.pageHasWwebjsHelpers(client);
                return found;
            }
            finally {
                helpersPending = false;
                if (found !== true && this.client === client && navigationsBefore === this.navigationCount) {
                    this.helpersMissingProbeAt = startedAt;
                    if (found === false)
                        this.pageWithoutHelpers = true;
                }
            }
        };
        const running = probe();
        let timeout;
        try {
            const injected = await Promise.race([
                running,
                new Promise((_, reject) => {
                    timeout = setTimeout(() => reject(new Error('liveness probe timed out')), 10_000);
                    timeout.unref?.();
                }),
            ]);
            if (connected && injected) {
                this.closeRecoveredEpisode(navigationsBefore);
                return true;
            }
            if (connected)
                return this.reinjectStillHealing();
            return this.isInNavigationReinjectWindow();
        }
        catch {
            if (connected && helpersPending) {
                void running.then(found => {
                    if (found && this.client === client)
                        this.closeRecoveredEpisode(navigationsBefore);
                }, () => undefined);
                const since = this.reinjectUnverifiedSince;
                return since === 0 || this.helpersMissingProbeAt - since < exports.NAVIGATION_EPISODE_CAP_MS;
            }
            if (connected)
                return this.reinjectStillHealing();
            return this.isInNavigationReinjectWindow();
        }
        finally {
            if (timeout)
                clearTimeout(timeout);
        }
    }
    closeRecoveredEpisode(navigationsBefore) {
        if (navigationsBefore !== this.navigationCount)
            return;
        this.clearNavigationReinjectWindow();
        this.reinjectUnverifiedSince = 0;
        this.pageWithoutHelpers = false;
    }
    reinjectStillHealing() {
        return this.reinjectUnverifiedSince === 0 || Date.now() - this.reinjectUnverifiedSince < exports.NAVIGATION_EPISODE_CAP_MS;
    }
    async pageHasWwebjsHelpers(client) {
        const page = client.pupPage;
        if (typeof page?.evaluate !== 'function')
            return true;
        return ((await page.evaluate(() => typeof window.WWebJS !== 'undefined')) === true);
    }
    async requestPairingCode(phoneNumber) {
        if (!this.client || this.status !== whatsapp_engine_interface_1.EngineStatus.QR_READY) {
            throw new engine_not_ready_error_1.EngineNotReadyError('Session is not waiting to be linked. Start it and wait for the QR stage.');
        }
        let lastError;
        for (let attempt = 1; attempt <= exports.PAIRING_CODE_MAX_ATTEMPTS; attempt++) {
            let timer;
            try {
                return await Promise.race([
                    this.client.requestPairingCode(phoneNumber),
                    new Promise((_resolve, reject) => {
                        timer = setTimeout(() => reject(new PairingCodeAttemptTimeoutError()), exports.PAIRING_CODE_ATTEMPT_TIMEOUT_MS);
                        timer.unref?.();
                    }),
                ]);
            }
            catch (error) {
                lastError = error;
                const reason = error instanceof Error ? error.message : String(error);
                const transient = error instanceof PairingCodeAttemptTimeoutError ||
                    isExecutionContextDestroyedError(reason) ||
                    isProtocolTimeout(error) ||
                    /callfunctionon timed out/i.test(reason);
                if (!transient) {
                    throw error;
                }
                if (attempt < exports.PAIRING_CODE_MAX_ATTEMPTS) {
                    await new Promise(resolve => {
                        const t = setTimeout(resolve, exports.PAIRING_CODE_RETRY_DELAY_MS);
                        t.unref?.();
                    });
                    if (!this.client || this.status !== whatsapp_engine_interface_1.EngineStatus.QR_READY) {
                        throw new engine_not_ready_error_1.EngineNotReadyError('Session is no longer waiting to be linked.');
                    }
                }
            }
            finally {
                if (timer) {
                    clearTimeout(timer);
                }
            }
        }
        throw new engine_transport_error_1.EngineTransportError(`Pairing code could not be generated after ${exports.PAIRING_CODE_MAX_ATTEMPTS} attempts: ` +
            `${lastError instanceof Error ? lastError.message : String(lastError)}`);
    }
}
exports.WwebjsLifecycle = WwebjsLifecycle;
//# sourceMappingURL=wwebjs-lifecycle.js.map