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
exports.BaileysLifecycle = exports.BAILEYS_PAIRING_CODE_WINDOW_MS = void 0;
exports.createProxyAgent = createProxyAgent;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const qrcode = __importStar(require("qrcode"));
const https_proxy_agent_1 = require("https-proxy-agent");
const socks_proxy_agent_1 = require("socks-proxy-agent");
const whatsapp_engine_interface_1 = require("../interfaces/whatsapp-engine.interface");
const engine_not_ready_error_1 = require("../../common/errors/engine-not-ready.error");
const proxy_dispatcher_1 = require("../../common/security/proxy-dispatcher");
const baileys_auth_store_1 = require("./baileys-auth-store");
const baileys_logger_1 = require("./baileys-logger");
const baileys_group_metadata_cache_1 = require("./baileys-group-metadata-cache");
const baileys_version_resolver_1 = require("./baileys-version-resolver");
const engine_patch_status_1 = require("./engine-patch-status");
const terminal_engine_failure_1 = require("../terminal-engine-failure");
const baileys_events_1 = require("./baileys-events");
const wa_id_1 = require("../identity/wa-id");
const BAILEYS_BROWSER = [
    process.env.BAILEYS_BROWSER_NAME?.trim() || 'Ubuntu',
    'Chrome',
    '120.0.0',
];
const BAILEYS_LOGOUT_ACK_TIMEOUT_MS = 8_000;
const BAILEYS_WS_CONNECTING_DEADLINE_MS = 60_000;
exports.BAILEYS_PAIRING_CODE_WINDOW_MS = 5 * 60_000;
const BAILEYS_QR_REF_MAX_LIFETIME_MS = 60_000;
const QR_REFS_ENDED = 'QR refs attempts ended';
const PAIRING_CODE_NOT_ENTERED = 'Pairing code was not entered in time';
const PROXY_CONNECT_TIMEOUT_MS = 20_000;
class AbortableHttpsProxyAgent extends https_proxy_agent_1.HttpsProxyAgent {
    connectTimeoutMs;
    constructor(proxyUrl, connectTimeoutMs) {
        super(proxyUrl);
        this.connectTimeoutMs = connectTimeoutMs;
    }
    async connect(req, opts) {
        const controller = new AbortController();
        const abort = () => controller.abort();
        req.once('abort', abort);
        const timer = setTimeout(abort, this.connectTimeoutMs);
        timer.unref();
        const connectOpts = this.connectOpts;
        this.connectOpts = { ...connectOpts, signal: controller.signal };
        const pending = super.connect(req, opts);
        this.connectOpts = connectOpts;
        try {
            return await pending;
        }
        finally {
            clearTimeout(timer);
            req.off('abort', abort);
        }
    }
}
function createProxyAgent(proxyUrl, connectTimeoutMs = PROXY_CONNECT_TIMEOUT_MS) {
    const { protocol } = new URL(proxyUrl);
    if (protocol === 'http:' || protocol === 'https:') {
        return new AbortableHttpsProxyAgent(proxyUrl, connectTimeoutMs);
    }
    if (protocol === 'socks4:' || protocol === 'socks5:') {
        const agent = new socks_proxy_agent_1.SocksProxyAgent(proxyUrl);
        agent.proxy.host = agent.proxy.host?.replace(/^\[|\]$/g, '');
        return agent;
    }
    throw new Error(`Unsupported proxy protocol for the baileys engine: ${protocol}`);
}
class BaileysLifecycle {
    host;
    static RECONNECT_STABILITY_RESET_MS = 5 * 60_000;
    static ADDRESSBOOK_QUIET_MS = 20_000;
    sock = null;
    status = whatsapp_engine_interface_1.EngineStatus.DISCONNECTED;
    qrCode = null;
    qrRenderSequence = 0;
    phoneNumber = null;
    pushName = null;
    teardown = new AbortController();
    get intentionalClose() {
        return this.teardown.signal.aborted;
    }
    versionResolver;
    connecting = false;
    reconnectAttempts = 0;
    reconnectTimer;
    connectingTimer;
    addressbookTimer;
    pairingTimers = [];
    lastConnectionCloseAt = 0;
    lib;
    dispatcher;
    groupMetadata = new baileys_group_metadata_cache_1.GroupMetadataCache((0, baileys_group_metadata_cache_1.groupMetadataCacheTtlMs)());
    constructor(host) {
        this.host = host;
        this.versionResolver = new baileys_version_resolver_1.BaileysVersionResolver({
            authDir: this.host.config.authDir || path.dirname(this.host.authPath),
            sessionId: this.host.config.sessionId,
            logger: this.host.logger,
        });
    }
    get loadedLib() {
        return this.lib;
    }
    async loadLib() {
        return (this.lib ??= await import('@whiskeysockets/baileys'));
    }
    fetchDispatcher() {
        const { proxyUrl } = this.host.config;
        if (!proxyUrl) {
            return undefined;
        }
        return (this.dispatcher ??= (0, proxy_dispatcher_1.createProxyDispatcher)(proxyUrl));
    }
    closeFetchDispatcher() {
        const dispatcher = this.dispatcher;
        this.dispatcher = undefined;
        void dispatcher?.close().catch(() => undefined);
    }
    async initialize() {
        if (this.intentionalClose) {
            return;
        }
        const chatStateStore = this.host.config.chatStateStore;
        if (chatStateStore) {
            await chatStateStore.refreshSession(this.host.config.sessionId).catch(() => undefined);
            if (this.intentionalClose) {
                return;
            }
        }
        const unapplied = (0, engine_patch_status_1.unappliedPatches)('baileys');
        if (unapplied.length) {
            this.host.logger.error((0, engine_patch_status_1.unappliedPatchesMessage)('baileys', unapplied));
        }
        try {
            await this.connect();
        }
        catch (err) {
            this.setStatus(whatsapp_engine_interface_1.EngineStatus.FAILED);
            this.host.getOnError()?.(err instanceof Error ? err.message : String(err));
            throw err;
        }
    }
    async connect() {
        if (this.connecting) {
            return;
        }
        this.connecting = true;
        try {
            await this.connectInner();
        }
        finally {
            this.connecting = false;
        }
    }
    async connectInner() {
        this.setStatus(whatsapp_engine_interface_1.EngineStatus.INITIALIZING);
        let proxyAgent;
        if (this.host.config.proxyUrl) {
            proxyAgent = createProxyAgent(this.host.config.proxyUrl);
            const { protocol, host } = new URL(this.host.config.proxyUrl);
            this.host.logger.log(`Using proxy: ${protocol}//${host}`, { sessionId: this.host.config.sessionId });
            if ((0, proxy_dispatcher_1.hasUnauthenticatableSocks4Credentials)(this.host.config.proxyUrl)) {
                this.host.logger.warn(`Proxy for session ${this.host.config.sessionId} has credentials on a SOCKS4 proxy, which has no ` +
                    `authentication step: the user name is sent as the connect request's user id and the password is ` +
                    `dropped. Use a socks5, http or https proxy, or an IP-authorized one.`);
            }
        }
        const b = await this.loadLib();
        if (this.intentionalClose) {
            return;
        }
        const { state, saveCreds } = await (0, baileys_auth_store_1.useAtomicMultiFileAuthState)(this.host.authPath, b, this.host.logger);
        if (this.intentionalClose) {
            return;
        }
        if (state.creds.me && !state.creds.account) {
            this.host.logger.warn('Discarding a pairing code that was never entered; the session shows a new QR', {
                sessionId: this.host.config.sessionId,
            });
            delete state.creds.me;
            delete state.creds.pairingCode;
            await saveCreds().catch(err => this.host.logger.warn('Could not save the credentials after discarding an unfinished pairing', {
                sessionId: this.host.config.sessionId,
                error: err instanceof Error ? err.message : String(err),
            }));
            if (this.intentionalClose) {
                return;
            }
        }
        const version = await this.versionResolver.resolve(b, {
            dispatcher: this.fetchDispatcher(),
            signal: this.teardown.signal,
        });
        const baileysLogger = (0, baileys_logger_1.createBaileysLogger)();
        state.keys = b.makeCacheableSignalKeyStore(state.keys, baileysLogger);
        if (this.intentionalClose) {
            return;
        }
        const previous = this.sock;
        if (previous) {
            try {
                previous.ev.removeAllListeners('connection.update');
                previous.ev.removeAllListeners('creds.update');
                previous.ev.removeAllListeners('messages.upsert');
                previous.ev.removeAllListeners('messages.update');
                previous.ev.removeAllListeners('message-receipt.update');
                previous.ev.removeAllListeners('contacts.upsert');
                previous.ev.removeAllListeners('contacts.update');
                previous.ev.removeAllListeners('chats.upsert');
                previous.ev.removeAllListeners('chats.update');
                previous.ev.removeAllListeners('chats.delete');
                previous.ev.removeAllListeners('messaging-history.set');
                previous.ev.removeAllListeners('lid-mapping.update');
                previous.ev.removeAllListeners('group-participants.update');
                previous.ev.removeAllListeners('groups.update');
                previous.ev.removeAllListeners('groups.upsert');
                previous.ev.removeAllListeners('group.join-request');
                previous.ev.removeAllListeners('call');
                previous.ev.removeAllListeners('presence.update');
                void previous.end(undefined);
            }
            catch {
            }
        }
        this.groupMetadata.clear();
        this.cancelPairingWindow();
        const fetchDispatcher = this.fetchDispatcher();
        const sock = b.default({
            auth: state,
            version,
            browser: BAILEYS_BROWSER,
            printQRInTerminal: false,
            agent: proxyAgent,
            fetchAgent: proxyAgent,
            options: (fetchDispatcher ? { dispatcher: fetchDispatcher } : {}),
            shouldSyncHistoryMessage: () => true,
            syncFullHistory: process.env.BAILEYS_SYNC_FULL_HISTORY === 'true',
            markOnlineOnConnect: process.env.BAILEYS_MARK_ONLINE_ON_CONNECT !== 'false',
            getMessage: async (key) => {
                if (!key.id) {
                    return undefined;
                }
                const stored = await this.host.config.messageStore?.getMessage(this.host.config.dbSessionId, key.id);
                if (!stored) {
                    return undefined;
                }
                const bare = (jid) => `${(0, wa_id_1.userPart)(jid)}@${jid.split('@')[1]}`;
                const asked = key.remoteJid ? bare(key.remoteJid) : undefined;
                const me = this.sock?.user;
                const askedByGuest = !!asked &&
                    stored.key.fromMe === true &&
                    (0, wa_id_1.chatKind)(stored.key.remoteJid ?? '') === 'individual' &&
                    [me?.id, me?.lid].some(own => !!own && bare(own) === asked);
                if (askedByGuest) {
                    return stored.message ?? undefined;
                }
                const neutral = (jid) => this.host.toNeutralJid(jid);
                const chat = [stored.key.remoteJid, stored.key.remoteJidAlt];
                if ((0, baileys_events_1.differentWaIds)(chat, [key.remoteJid], neutral)) {
                    return undefined;
                }
                const lid = key.remoteJid;
                if (lid?.endsWith('@lid') && neutral(lid).endsWith('@lid')) {
                    const pn = await this.sock?.signalRepository?.lidMapping?.getPNForLID(lid).catch(() => null);
                    if (pn && (0, baileys_events_1.differentWaIds)(chat, [pn], neutral)) {
                        return undefined;
                    }
                }
                return stored.message ?? undefined;
            },
            cachedGroupMetadata: jid => this.groupMetadata.read(jid, () => sock.groupMetadata(jid)),
            logger: baileysLogger,
        });
        this.sock = sock;
        sock.ws.on('unexpected-response', (_req, res) => {
            void sock.end(new Error(`WebSocket upgrade refused (HTTP ${res.statusCode})`));
        });
        this.connectingTimer = setTimeout(() => {
            if (this.sock === sock && sock.ws.isConnecting) {
                void sock.end(new Error(`WebSocket still connecting after ${BAILEYS_WS_CONNECTING_DEADLINE_MS} ms`));
            }
        }, BAILEYS_WS_CONNECTING_DEADLINE_MS);
        this.connectingTimer.unref();
        let awaitingFirstSync = !((state.creds.accountSyncCounter ?? 0) > 0);
        sock.ev.on('creds.update', update => {
            void saveCreds().catch(err => {
                this.host.logger.warn('Baileys creds.update save failed', {
                    sessionId: this.host.config.sessionId,
                    error: err instanceof Error ? err.message : String(err),
                });
            });
            if (awaitingFirstSync && (update.accountSyncCounter ?? 0) > 0) {
                awaitingFirstSync = false;
                this.scheduleAddressbookRestore(sock);
            }
            const name = update.me?.name;
            if (name && name !== this.pushName && this.sock === sock && this.status === whatsapp_engine_interface_1.EngineStatus.READY) {
                this.pushName = name;
                this.host.getOnPushNameChanged()?.(name);
            }
        });
        sock.ev.on('connection.update', update => this.handleConnectionUpdate(update));
        sock.ev.on('messages.upsert', event => this.host.handleMessagesUpsert(event));
        sock.ev.on('messages.update', updates => this.host.handleMessagesUpdate(updates));
        sock.ev.on('message-receipt.update', updates => this.host.handleMessageReceiptUpdate(updates));
        sock.ev.on('contacts.upsert', contacts => {
            this.host.logContactEvent('contacts.upsert', contacts);
            this.host.upsertContacts(contacts);
        });
        sock.ev.on('contacts.update', updates => {
            this.host.logContactEvent('contacts.update', updates);
            this.host.upsertContacts(updates);
        });
        sock.ev.on('chats.upsert', chats => {
            this.host.logger.debug('Baileys chats event', {
                action: 'baileys_chats',
                event: 'upsert',
                count: chats?.length ?? 0,
            });
            this.host.upsertChats(chats);
        });
        sock.ev.on('chats.update', updates => {
            this.host.logger.debug('Baileys chats event', {
                action: 'baileys_chats',
                event: 'update',
                count: updates?.length ?? 0,
            });
            for (const update of updates ?? []) {
                if (Object.hasOwn(update, 'ephemeralExpiration'))
                    this.groupMetadata.invalidate(update.id);
            }
            this.host.upsertChats(updates);
        });
        sock.ev.on('chats.delete', ids => {
            this.host.logger.debug('Baileys chats event', {
                action: 'baileys_chats',
                event: 'delete',
                count: ids?.length ?? 0,
            });
            this.host.removeChats(ids);
        });
        sock.ev.on('group-participants.update', event => {
            this.groupMetadata.invalidate(event.id);
            this.host.handleGroupParticipantsUpdate(event);
        });
        sock.ev.on('groups.update', updates => {
            this.groupMetadata.applyUpdates(updates);
            this.host.handleGroupsUpdate(updates);
        });
        sock.ev.on('groups.upsert', groups => {
            for (const group of groups)
                this.groupMetadata.invalidate(group.id);
            this.host.handleGroupsUpsert(groups);
        });
        sock.ev.on('group.join-request', event => this.host.handleGroupJoinRequest(event));
        sock.ev.on('messaging-history.set', history => {
            if (this.addressbookTimer) {
                this.scheduleAddressbookRestore(sock);
            }
            this.host.upsertContacts((history.contacts ?? []).map(c => ({
                ...c,
                notify: c.notify ?? c.name,
                name: undefined,
            })));
            this.host.upsertChats(history.chats);
            this.host.addLidMappings(history.lidPnMappings ?? []);
            void this.host
                .captureHistoryMessages(history.messages ?? [])
                .catch(error => this.host.logger.warn('Failed to capture history messages', { error: String(error) }));
            this.host.logger.debug('History sync received', {
                action: 'baileys_history_set',
                sessionId: this.host.config.sessionId,
                syncType: history.syncType,
                isLatest: history.isLatest,
                progress: history.progress,
                chats: history.chats?.length ?? 0,
                messages: history.messages?.length ?? 0,
                contacts: history.contacts?.length ?? 0,
                namedContacts: history.contacts?.filter(c => c.name || c.notify).length ?? 0,
                lidContacts: history.contacts?.filter(c => c.lid).length ?? 0,
                lidPnMappings: history.lidPnMappings?.length ?? 0,
            });
        });
        sock.ev.on('lid-mapping.update', ({ lid, pn }) => this.host.addLidMappings([{ lid, pn }]));
        sock.ev.on('call', calls => this.host.handleCallEvents(calls));
        sock.ev.on('presence.update', update => this.host.handlePresenceUpdate(update));
    }
    scheduleAddressbookRestore(sock) {
        this.cancelAddressbookRestore();
        this.addressbookTimer = setTimeout(() => {
            this.addressbookTimer = undefined;
            if (this.sock !== sock) {
                return;
            }
            this.host.restoreAddressbookSnapshot().catch(err => {
                this.host.logger.warn('Address-book restore after the initial sync failed', {
                    sessionId: this.host.config.sessionId,
                    error: err instanceof Error ? err.message : String(err),
                });
            });
        }, BaileysLifecycle.ADDRESSBOOK_QUIET_MS);
        this.addressbookTimer.unref();
    }
    cancelAddressbookRestore() {
        clearTimeout(this.addressbookTimer);
        this.addressbookTimer = undefined;
    }
    armPairingWindow(sock) {
        this.cancelPairingWindow();
        const waiting = () => this.sock === sock && this.status === whatsapp_engine_interface_1.EngineStatus.QR_READY;
        const dropQr = setTimeout(() => {
            if (waiting())
                this.qrCode = null;
        }, BAILEYS_QR_REF_MAX_LIFETIME_MS);
        const end = setTimeout(() => {
            if (!waiting())
                return;
            this.host.logger.log('Pairing code was not entered in time; starting a new registration', {
                sessionId: this.host.config.sessionId,
                action: 'baileys_pairing_code_expired',
            });
            void sock.end(new Error(PAIRING_CODE_NOT_ENTERED));
        }, exports.BAILEYS_PAIRING_CODE_WINDOW_MS);
        dropQr.unref();
        end.unref();
        this.pairingTimers = [dropQr, end];
    }
    cancelPairingWindow() {
        for (const timer of this.pairingTimers)
            clearTimeout(timer);
        this.pairingTimers = [];
    }
    handleConnectionUpdate(update) {
        const { connection, qr, isNewLogin, lastDisconnect, reachoutTimeLock } = update;
        if (reachoutTimeLock) {
            this.reportReachoutTimelock(reachoutTimeLock);
        }
        if (qr && this.status !== whatsapp_engine_interface_1.EngineStatus.AUTHENTICATING) {
            void this.handleQrCode(qr);
        }
        if (isNewLogin) {
            this.qrCode = null;
            this.reconnectAttempts = 0;
            this.cancelPairingWindow();
            this.setStatus(whatsapp_engine_interface_1.EngineStatus.AUTHENTICATING);
        }
        if (connection === 'connecting') {
            this.setStatus(whatsapp_engine_interface_1.EngineStatus.INITIALIZING);
        }
        if (connection === 'open') {
            clearTimeout(this.connectingTimer);
            this.cancelPairingWindow();
            this.qrCode = null;
            this.phoneNumber = this.host.extractPhone(this.sock?.user?.id);
            this.pushName = this.sock?.authState?.creds?.me?.name ?? null;
            const me = this.sock?.user;
            if (me?.id && me.lid) {
                this.host.addLidMappings([{ lid: `${(0, wa_id_1.userPart)(me.lid)}@lid`, pn: `${(0, wa_id_1.userPart)(me.id)}@s.whatsapp.net` }]);
            }
            this.setStatus(whatsapp_engine_interface_1.EngineStatus.READY);
            this.host.getOnReady()?.(this.phoneNumber ?? '', this.pushName ?? '');
            void this.probeAccountRestriction();
            void this.host.hydrateNames();
        }
        if (connection === 'close') {
            clearTimeout(this.connectingTimer);
            this.cancelAddressbookRestore();
            this.cancelPairingWindow();
            const statusCode = lastDisconnect?.error?.output
                ?.statusCode;
            if (this.intentionalClose) {
                this.setStatus(whatsapp_engine_interface_1.EngineStatus.DISCONNECTED);
                return;
            }
            if (statusCode === this.lib?.DisconnectReason.loggedOut) {
                void this.handleRemoteLoggedOut();
                return;
            }
            if (statusCode === (this.lib?.DisconnectReason.connectionReplaced ?? 440)) {
                this.setStatus(whatsapp_engine_interface_1.EngineStatus.FAILED);
                this.dropConnectionState();
                this.host.getOnError()?.(`${terminal_engine_failure_1.CONNECTION_REPLACED_REASON} — stop the other instance, then start this session again`);
                return;
            }
            if (statusCode === (this.lib?.DisconnectReason.forbidden ?? 403)) {
                this.setStatus(whatsapp_engine_interface_1.EngineStatus.FAILED);
                this.dropConnectionState();
                this.host.getOnError()?.(`${terminal_engine_failure_1.ACCOUNT_REJECTED_REASON} — the number is likely banned or blocked; reconnecting will not help`);
                return;
            }
            this.host.logger.log('Baileys connection dropped; reconnecting', {
                sessionId: this.host.config.sessionId,
                statusCode,
                reason: lastDisconnect?.error?.message,
                action: 'baileys_connection_dropped',
            });
            const closeMessage = lastDisconnect?.error?.message;
            const qrWindowEnded = closeMessage === QR_REFS_ENDED || closeMessage === PAIRING_CODE_NOT_ENTERED;
            this.setStatus(whatsapp_engine_interface_1.EngineStatus.INITIALIZING);
            if (this.reconnectTimer) {
                return;
            }
            const now = Date.now();
            if (qrWindowEnded || now - this.lastConnectionCloseAt > BaileysLifecycle.RECONNECT_STABILITY_RESET_MS) {
                this.reconnectAttempts = 0;
            }
            this.lastConnectionCloseAt = now;
            this.scheduleReconnect(!qrWindowEnded);
        }
    }
    reportReachoutTimelock(state) {
        const report = this.host.getOnAccountRestriction();
        if (!report)
            return;
        if (!state.isActive) {
            report(null);
            return;
        }
        const endsAt = state.timeEnforcementEnds?.getTime();
        report({
            kind: 'reachout_timelock',
            code: state.enforcementType ?? 'DEFAULT',
            expiresAt: typeof endsAt === 'number' && Number.isFinite(endsAt) ? endsAt : undefined,
        });
    }
    async probeAccountRestriction() {
        try {
            await this.sock?.fetchAccountReachoutTimelock();
        }
        catch (error) {
            this.host.logger.debug('Could not read the account restriction state', {
                action: 'baileys_restriction_probe_failed',
                sessionId: this.host.config.sessionId,
                error: String(error),
            });
        }
    }
    scheduleReconnect(countAttempt = true) {
        if (this.intentionalClose || this.reconnectTimer) {
            return;
        }
        if (countAttempt) {
            this.reconnectAttempts += 1;
        }
        const step = Math.max(this.reconnectAttempts - 1, 0);
        const delay = Math.min(60_000, 1_000 * 2 ** step) + Math.floor(Math.random() * 1000);
        if (countAttempt) {
            this.host.getOnReconnecting()?.(this.reconnectAttempts, delay);
        }
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = undefined;
            if (this.intentionalClose) {
                return;
            }
            void this.connect().catch(err => {
                this.host.logger.warn('Baileys reconnect attempt failed; will retry', {
                    attempt: this.reconnectAttempts,
                    error: err instanceof Error ? err.message : String(err),
                });
                this.scheduleReconnect();
            });
        }, delay);
    }
    async handleQrCode(qr) {
        const sock = this.sock;
        const sequence = ++this.qrRenderSequence;
        this.qrCode = null;
        try {
            const rendered = await qrcode.toDataURL(qr);
            if (sequence !== this.qrRenderSequence ||
                this.sock !== sock ||
                !sock?.ws.isOpen ||
                this.status === whatsapp_engine_interface_1.EngineStatus.AUTHENTICATING ||
                this.status === whatsapp_engine_interface_1.EngineStatus.READY ||
                sock.user?.id) {
                return;
            }
            this.qrCode = rendered;
            this.setStatus(whatsapp_engine_interface_1.EngineStatus.QR_READY);
            this.host.getOnQRCode()?.(this.qrCode);
        }
        catch (error) {
            this.host.logger.error('Error generating QR code', String(error));
        }
    }
    dropConnectionState() {
        this.host.liveCalls.clear();
        this.groupMetadata.clear();
    }
    disconnect() {
        this.teardown.abort();
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = undefined;
        }
        clearTimeout(this.connectingTimer);
        this.cancelAddressbookRestore();
        this.cancelPairingWindow();
        void this.sock?.end(undefined);
        this.sock = null;
        this.closeFetchDispatcher();
        this.dropConnectionState();
        this.setStatus(whatsapp_engine_interface_1.EngineStatus.DISCONNECTED);
        return Promise.resolve();
    }
    async logout() {
        this.teardown.abort();
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = undefined;
        }
        const sourceSock = this.sock;
        if (!sourceSock) {
            throw new Error('No live WhatsApp socket — the unlink was not sent');
        }
        try {
            const b = await this.loadLib();
            const jid = sourceSock.authState?.creds?.me?.id;
            if (!jid || !sourceSock.authState?.creds?.account) {
                if (!(await this.keepsQuarantinedCredentials())) {
                    throw new engine_not_ready_error_1.EngineNotReadyError('This session has no linked WhatsApp device, so there is nothing to unlink. It was stopped; start it to link a device, or delete it.');
                }
                throw new Error('No linked companion identity — the unlink was not sent');
            }
            const response = await sourceSock.query({
                tag: 'iq',
                attrs: { to: b.S_WHATSAPP_NET, type: 'set', id: sourceSock.generateMessageTag(), xmlns: 'md' },
                content: [{ tag: 'remove-companion-device', attrs: { jid, reason: 'user_initiated' } }],
            }, BAILEYS_LOGOUT_ACK_TIMEOUT_MS);
            if (!response) {
                throw new Error('WhatsApp did not acknowledge the unlink request');
            }
            this.localSocketShutdown(sourceSock);
            this.host.fenceStoredWrites();
            await this.clearStoredAccountState();
            await this.clearAuthState();
        }
        catch (err) {
            this.localSocketShutdown(sourceSock);
            throw err;
        }
    }
    async keepsQuarantinedCredentials() {
        try {
            return (await fs.promises.readdir(this.host.authPath)).some(entry => entry.startsWith('corrupt-'));
        }
        catch (err) {
            return err?.code !== 'ENOENT';
        }
    }
    localSocketShutdown(sourceSock) {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = undefined;
        }
        clearTimeout(this.connectingTimer);
        this.cancelAddressbookRestore();
        this.cancelPairingWindow();
        try {
            void sourceSock.end(undefined);
        }
        catch {
        }
        this.closeFetchDispatcher();
        this.dropConnectionState();
        if (this.sock === sourceSock) {
            this.sock = null;
        }
        this.setStatus(whatsapp_engine_interface_1.EngineStatus.DISCONNECTED);
    }
    async handleRemoteLoggedOut() {
        this.setStatus(whatsapp_engine_interface_1.EngineStatus.DISCONNECTED);
        const dead = this.sock;
        this.sock = null;
        this.dropConnectionState();
        this.host.fenceStoredWrites();
        void dead?.end(undefined);
        this.closeFetchDispatcher();
        const cleanup = (async () => {
            try {
                await this.clearStoredAccountState();
                await this.clearAuthState();
            }
            catch (err) {
                this.setStatus(whatsapp_engine_interface_1.EngineStatus.FAILED);
                this.host.getOnError()?.(`${terminal_engine_failure_1.LOGOUT_CLEANUP_FAILED_REASON}: ${err instanceof Error ? err.message : String(err)}`);
                return;
            }
            this.host.getOnDisconnected()?.('logged out');
        })();
        this.host.getOnCredentialTeardownStarted()?.(cleanup);
        await cleanup;
    }
    async clearStoredAccountState() {
        const { messageStore, chatStateStore, dbSessionId, sessionId } = this.host.config;
        const warn = (what) => (err) => this.host.logger.warn(`Failed to clear the stored ${what} of an unlinked account`, {
            sessionId,
            error: err instanceof Error ? err.message : String(err),
        });
        await messageStore?.clearSession(dbSessionId).catch(warn('messages'));
        await chatStateStore?.clearSession(sessionId).catch(warn('chat states'));
    }
    async clearAuthState() {
        try {
            await fs.promises.rm(this.host.authPath, { recursive: true, force: true });
            this.host.logger.log('Cleared Baileys auth state', { authPath: this.host.authPath });
        }
        catch (err) {
            this.host.logger.warn('Failed to clear Baileys auth state', {
                error: err instanceof Error ? err.message : String(err),
            });
            throw err;
        }
    }
    destroy() {
        this.teardown.abort();
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = undefined;
        }
        clearTimeout(this.connectingTimer);
        this.cancelAddressbookRestore();
        this.cancelPairingWindow();
        void this.sock?.end(undefined);
        this.sock = null;
        this.closeFetchDispatcher();
        this.dropConnectionState();
        this.setStatus(whatsapp_engine_interface_1.EngineStatus.DISCONNECTED);
        return Promise.resolve();
    }
    forceDestroy() {
        return this.destroy();
    }
    getStatus() {
        return this.status;
    }
    async probeLiveness() {
        return this.status === whatsapp_engine_interface_1.EngineStatus.READY && this.sock != null;
    }
    getQRCode() {
        return this.qrCode;
    }
    async requestPairingCode(phoneNumber) {
        if (!this.sock?.ws.isOpen || this.status !== whatsapp_engine_interface_1.EngineStatus.QR_READY) {
            throw new engine_not_ready_error_1.EngineNotReadyError('Session is not waiting to be linked. Start it and wait for the QR stage.');
        }
        const sock = this.sock;
        const code = await sock.requestPairingCode(phoneNumber);
        this.armPairingWindow(sock);
        return code;
    }
    getPhoneNumber() {
        return this.phoneNumber;
    }
    getPushName() {
        return this.pushName;
    }
    ensureReady() {
        if (this.status !== whatsapp_engine_interface_1.EngineStatus.READY || !this.sock) {
            throw new engine_not_ready_error_1.EngineNotReadyError();
        }
    }
    setStatus(status) {
        if (this.status === status) {
            return;
        }
        if (status !== whatsapp_engine_interface_1.EngineStatus.QR_READY) {
            this.qrCode = null;
        }
        this.status = status;
        this.host.getOnStateChanged()?.(status);
    }
}
exports.BaileysLifecycle = BaileysLifecycle;
//# sourceMappingURL=baileys-lifecycle.js.map