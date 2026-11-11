"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginCapabilityContext = void 0;
exports.dispatchConversationMedia = dispatchConversationMedia;
const common_1 = require("@nestjs/common");
const async_hooks_1 = require("async_hooks");
const wa_id_1 = require("../../engine/identity/wa-id");
const conversation_mapping_service_1 = require("../../modules/integration/conversation-mapping.service");
const logger_service_1 = require("../../common/services/logger.service");
const plugin_activation_1 = require("./plugin-activation");
const plugin_net_1 = require("./plugin-net");
const conversation_send_facade_1 = require("./conversation-send-facade");
const plugin_interfaces_1 = require("./plugin.interfaces");
function dispatchConversationMedia(svc, sessionId, opts) {
    const dto = { chatId: opts.chatId, url: opts.url, caption: opts.caption };
    switch (opts.type) {
        case 'image':
            return svc.sendImage(sessionId, dto);
        case 'video':
            return svc.sendVideo(sessionId, dto);
        case 'audio':
            return svc.sendAudio(sessionId, dto);
        case 'voice':
            return svc.sendAudio(sessionId, { ...dto, ptt: true });
        case 'file':
            return svc.sendDocument(sessionId, dto);
    }
}
const messageText = (message) => {
    try {
        return String(message);
    }
    catch {
        return logger_service_1.UNPRINTABLE;
    }
};
const errorText = (error) => {
    try {
        return error instanceof Error ? error.message : String(error);
    }
    catch {
        return logger_service_1.UNPRINTABLE;
    }
};
const isRootPrototype = (prototype) => prototype === null || Object.getPrototypeOf(prototype) === null;
const metaFields = (meta) => {
    if (meta === undefined || meta === null)
        return {};
    if (typeof meta !== 'object')
        return { meta };
    try {
        return isRootPrototype(Object.getPrototypeOf(meta)) ? meta : { meta };
    }
    catch {
        return meta;
    }
};
class PluginCapabilityContext {
    logger;
    hostServices;
    hookManager;
    pluginStorage;
    lidMappingStore;
    hookSession = new async_hooks_1.AsyncLocalStorage();
    constructor(logger, hostServices, hookManager, pluginStorage, lidMappingStore) {
        this.logger = logger;
        this.hostServices = hostServices;
        this.hookManager = hookManager;
        this.pluginStorage = pluginStorage;
        this.lidMappingStore = lidMappingStore;
    }
    assertPermission(manifest, permission) {
        if (!(manifest.permissions ?? []).includes(permission)) {
            throw new plugin_interfaces_1.PluginCapabilityError(`Plugin ${manifest.id} is missing the '${permission}' permission required for this capability. ` +
                `Add "${permission}" to the "permissions" array in the plugin's manifest.json, then reload the plugin.`);
        }
    }
    assertSessionAllowed(manifest, sessionId) {
        const allowed = manifest.sessions ?? ['*'];
        if (!allowed.includes('*') && !allowed.includes(sessionId)) {
            throw new plugin_interfaces_1.PluginCapabilityError(`Plugin ${manifest.id} is not permitted to act on session ${sessionId}`);
        }
    }
    isHookActive(plugin, sessionId) {
        return (0, plugin_activation_1.isPluginActiveForSession)(plugin.manifest.sessionScoped ?? true, plugin.activeSessions ?? ['*'], sessionId);
    }
    assertSessionActive(plugin, sessionId) {
        this.assertSessionAllowed(plugin.manifest, sessionId);
        if (!this.isHookActive(plugin, sessionId)) {
            throw new plugin_interfaces_1.PluginCapabilityError(`Plugin ${plugin.manifest.id} is not activated for session ${sessionId}`);
        }
    }
    resolveEngine(plugin, sessionId) {
        this.assertSessionActive(plugin, sessionId);
        const engine = this.hostServices.getSessionPort().getEngine(sessionId);
        if (!engine) {
            throw new plugin_interfaces_1.PluginCapabilityError(`Session ${sessionId} has no active engine (unknown or not started)`);
        }
        return engine;
    }
    resolveEngineRead(plugin, sessionId) {
        this.assertPermission(plugin.manifest, plugin_interfaces_1.PluginCapabilityPermission.ENGINE_READ);
        return this.resolveEngine(plugin, sessionId);
    }
    async isSessionGone(sessionId) {
        try {
            await this.hostServices.getSessionPort().findOne(sessionId);
            return false;
        }
        catch (error) {
            return error instanceof common_1.NotFoundException;
        }
    }
    createPluginContext(plugin) {
        const hookSession = this.hookSession;
        return {
            pluginId: plugin.manifest.id,
            manifest: plugin.manifest,
            get config() {
                return (0, plugin_activation_1.resolvePluginConfig)(plugin.config, plugin.sessionConfig, hookSession.getStore()?.sessionId, plugin.manifest.sessionScoped !== false, plugin.manifest);
            },
            hookManager: this.hookManager,
            logger: this.buildPluginLogger(plugin),
            storage: this.buildStorageCapability(plugin),
            registerHook: (event, handler, priority) => {
                this.hookManager.register(plugin.manifest.id, event, async (hookCtx) => {
                    if (!this.isHookActive(plugin, hookCtx.sessionId))
                        return { continue: true };
                    return this.hookSession.run({ sessionId: hookCtx.sessionId }, () => handler(hookCtx));
                }, priority);
            },
            registerWebhook: () => {
                throw new plugin_interfaces_1.PluginCapabilityError(`Plugin ${plugin.manifest.id}: registerWebhook (ingress) is only available to sandboxed plugins`);
            },
            messages: this.buildMessagesCapability(plugin),
            engine: this.buildEngineReadCapability(plugin),
            net: this.buildNetCapability(plugin),
            conversations: this.buildConversationsCapability(plugin),
            handover: this.buildHandoverCapability(plugin),
            mappings: this.buildMappingsCapability(plugin),
        };
    }
    buildPluginLogger(plugin) {
        return {
            log: (message, meta) => this.logger.log(`[${plugin.manifest.id}] ${messageText(message)}`, metaFields(meta), {
                pluginId: plugin.manifest.id,
            }),
            debug: (message, meta) => this.logger.debug(`[${plugin.manifest.id}] ${messageText(message)}`, metaFields(meta), {
                pluginId: plugin.manifest.id,
            }),
            warn: (message, meta) => this.logger.warn(`[${plugin.manifest.id}] ${messageText(message)}`, metaFields(meta), {
                pluginId: plugin.manifest.id,
            }),
            error: (message, error, meta) => this.logger.error(`[${plugin.manifest.id}] ${messageText(message)}`, error === undefined ? undefined : errorText(error), metaFields(meta), { pluginId: plugin.manifest.id }),
        };
    }
    buildMessagesCapability(plugin) {
        return {
            sendText: async (sessionId, chatId, text) => {
                this.assertPermission(plugin.manifest, plugin_interfaces_1.PluginCapabilityPermission.MESSAGES_SEND);
                this.resolveEngine(plugin, sessionId);
                return this.hostServices.getMessagePort().sendText(sessionId, { chatId, text });
            },
            reply: async (sessionId, chatId, quotedMessageId, text) => {
                this.assertPermission(plugin.manifest, plugin_interfaces_1.PluginCapabilityPermission.MESSAGES_SEND);
                this.resolveEngine(plugin, sessionId);
                return this.hostServices.getMessagePort().reply(sessionId, { chatId, quotedMessageId, text });
            },
        };
    }
    buildEngineReadCapability(plugin) {
        return {
            getGroupInfo: async (sessionId, groupId) => this.resolveEngineRead(plugin, sessionId).getGroupInfo(groupId),
            getContacts: async (sessionId) => this.resolveEngineRead(plugin, sessionId).getContacts(),
            getContactById: async (sessionId, contactId) => this.resolveEngineRead(plugin, sessionId).getContactById(contactId),
            checkNumberExists: async (sessionId, phone) => this.resolveEngineRead(plugin, sessionId).checkNumberExists(phone),
            getChats: async (sessionId) => this.resolveEngineRead(plugin, sessionId).getChats(),
            getChatHistory: async (sessionId, chatId, limit, includeMedia) => this.resolveEngineRead(plugin, sessionId).getChatHistory(chatId, Math.min(Math.max(typeof limit === 'number' && Number.isFinite(limit) ? Math.trunc(limit) : 50, 1), 100), includeMedia ?? false),
            canonicalChatId: async (sessionId, chatId) => {
                this.resolveEngineRead(plugin, sessionId);
                const parsed = (0, wa_id_1.parseWaId)(chatId);
                const phone = parsed.kind === 'lid' ? await this.lidMappingStore?.findPhoneForLid?.(chatId).catch(() => null) : null;
                return (0, wa_id_1.toNeutralJid)(chatId, () => phone ?? null);
            },
        };
    }
    buildStorageCapability(plugin) {
        const storage = this.pluginStorage.createPluginStorage(plugin.manifest.id);
        const gate = () => this.assertPermission(plugin.manifest, plugin_interfaces_1.PluginCapabilityPermission.STORAGE_USE);
        return {
            get: async (key) => {
                gate();
                return storage.get(key);
            },
            set: async (key, value) => {
                gate();
                return storage.set(key, value);
            },
            delete: async (key) => {
                gate();
                return storage.delete(key);
            },
            list: async (prefix) => {
                gate();
                return storage.list(prefix);
            },
        };
    }
    async enabledInstanceConfigs(pluginId) {
        try {
            const rows = await this.hostServices.getPluginInstancePort().list(pluginId);
            return rows.filter(row => row.enabled).map(row => row.config ?? {});
        }
        catch {
            return [];
        }
    }
    buildNetCapability(plugin) {
        return {
            fetch: async (url, init) => {
                this.assertPermission(plugin.manifest, plugin_interfaces_1.PluginCapabilityPermission.NET_FETCH);
                const netConfigs = [
                    plugin.config ?? {},
                    ...Object.values(plugin.sessionConfig ?? {}),
                    ...(await this.enabledInstanceConfigs(plugin.manifest.id)),
                ];
                const allow = [
                    ...new Set(netConfigs.flatMap(cfg => (0, plugin_net_1.effectiveNetAllow)(plugin.manifest.net?.allow, plugin.manifest.net?.allowConfigHosts, cfg))),
                ];
                if (!(0, plugin_net_1.isNetHostAllowed)(allow, url)) {
                    throw new plugin_interfaces_1.PluginCapabilityError(`Plugin ${plugin.manifest.id} may not fetch ${url} — add its host to net.allow or net.allowConfigHosts`);
                }
                return (0, plugin_net_1.performPluginFetch)(url, init);
            },
        };
    }
    buildConversationsCapability(plugin) {
        return (0, conversation_send_facade_1.buildConversationSendFacade)({
            manifest: plugin.manifest,
            assertPermission: this.assertPermission.bind(this),
            assertSessionActive: (sessionId) => this.assertSessionActive(plugin, sessionId),
            resolveChatId: async (env) => {
                if (!env.instanceId || !env.source?.externalConversationId) {
                    throw new plugin_interfaces_1.PluginCapabilityError(`Plugin ${plugin.manifest.id}: conversation.send requires chatId, or both instanceId and source to resolve one`);
                }
                const mapping = await this.hostServices
                    .getConversationMappingPort()
                    .getByProvider(plugin.manifest.id, env.instanceId, env.source.externalConversationId);
                if (!mapping) {
                    throw new plugin_interfaces_1.PluginCapabilityError(`Plugin ${plugin.manifest.id}: no conversation mapping for instance ${env.instanceId} / ${env.source.externalConversationId}`);
                }
                if (env.sessionId && mapping.sessionId !== env.sessionId) {
                    if (await this.isSessionGone(mapping.sessionId)) {
                        await this.hostServices.getConversationMappingPort().rebindSession(mapping.id, env.sessionId);
                        this.logger.warn(`Rebound conversation mapping for instance ${env.instanceId} / ${env.source.externalConversationId} ` +
                            `from deleted session ${mapping.sessionId} to ${env.sessionId}`, { pluginId: plugin.manifest.id, action: 'conversation_mapping_rebound' });
                        return mapping.chatId;
                    }
                    throw new plugin_interfaces_1.PluginCapabilityError(`Plugin ${plugin.manifest.id}: conversation mapping for instance ${env.instanceId} / ${env.source.externalConversationId} belongs to session ${mapping.sessionId}, not ${env.sessionId}`);
                }
                return mapping.chatId;
            },
            runGuarded: (events, run) => events.some(e => this.hookManager.isInFlight(e))
                ? this.hookManager.runInFlight(events, run)
                : run(),
            sendText: (sessionId, opts) => this.hostServices.getMessagePort().sendText(sessionId, opts),
            reply: (sessionId, opts) => this.hostServices.getMessagePort().reply(sessionId, opts),
            sendMedia: (sessionId, opts) => dispatchConversationMedia(this.hostServices.getMessagePort(), sessionId, opts),
            sendLocation: (sessionId, opts) => this.hostServices.getMessagePort().sendLocation(sessionId, opts),
        });
    }
    buildHandoverCapability(plugin) {
        return {
            set: async (key, state) => {
                this.assertPermission(plugin.manifest, plugin_interfaces_1.PluginCapabilityPermission.CONVERSATION_SEND);
                this.assertSessionActive(plugin, key.sessionId);
                if (state !== 'bot' && state !== 'human' && state !== 'closed') {
                    throw new plugin_interfaces_1.PluginCapabilityError(`Plugin ${plugin.manifest.id}: handover state must be 'bot', 'human' or 'closed'`);
                }
                const mapping = await this.hostServices.getConversationMappingPort().get({
                    sessionId: key.sessionId,
                    chatId: key.chatId,
                    pluginId: plugin.manifest.id,
                    instanceId: key.instanceId,
                });
                if (!mapping) {
                    throw new plugin_interfaces_1.PluginCapabilityError(`Plugin ${plugin.manifest.id}: no conversation mapping for session ${key.sessionId} / chat ${key.chatId} / instance ${key.instanceId}`);
                }
                await this.hostServices.getConversationMappingPort().setHandover(mapping.id, state);
            },
        };
    }
    buildMappingsCapability(plugin) {
        return {
            upsert: async (key, providerConversationId) => {
                this.assertPermission(plugin.manifest, plugin_interfaces_1.PluginCapabilityPermission.CONVERSATION_SEND);
                this.assertSessionActive(plugin, key.sessionId);
                const mappingKey = {
                    sessionId: key.sessionId,
                    chatId: key.chatId,
                    pluginId: plugin.manifest.id,
                    instanceId: key.instanceId,
                };
                try {
                    await this.hostServices.getConversationMappingPort().upsert(mappingKey, providerConversationId);
                }
                catch (error) {
                    if (!(error instanceof conversation_mapping_service_1.ConversationMappingConflict))
                        throw error;
                    const stale = await this.hostServices
                        .getConversationMappingPort()
                        .getByProvider(plugin.manifest.id, key.instanceId, providerConversationId);
                    if (!stale || !(await this.isSessionGone(stale.sessionId)))
                        throw error;
                    await this.hostServices.getConversationMappingPort().delete(stale.id);
                    await this.hostServices.getConversationMappingPort().upsert(mappingKey, providerConversationId);
                }
            },
            get: async (key) => {
                this.assertPermission(plugin.manifest, plugin_interfaces_1.PluginCapabilityPermission.CONVERSATION_SEND);
                this.assertSessionActive(plugin, key.sessionId);
                const m = await this.hostServices.getConversationMappingPort().get({
                    sessionId: key.sessionId,
                    chatId: key.chatId,
                    pluginId: plugin.manifest.id,
                    instanceId: key.instanceId,
                });
                return m ? { providerConversationId: m.providerConversationId, handoverState: m.handoverState } : null;
            },
            getByProvider: async (instanceId, providerConversationId) => {
                this.assertPermission(plugin.manifest, plugin_interfaces_1.PluginCapabilityPermission.CONVERSATION_SEND);
                const m = await this.hostServices
                    .getConversationMappingPort()
                    .getByProvider(plugin.manifest.id, instanceId, providerConversationId);
                if (m)
                    this.assertSessionActive(plugin, m.sessionId);
                return m ? { sessionId: m.sessionId, chatId: m.chatId, handoverState: m.handoverState } : null;
            },
        };
    }
}
exports.PluginCapabilityContext = PluginCapabilityContext;
//# sourceMappingURL=plugin-capability-context.js.map