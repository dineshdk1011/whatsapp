"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaileysPlugin = void 0;
const plugins_1 = require("../../../core/plugins");
const baileys_adapter_1 = require("../../adapters/baileys.adapter");
class BaileysPlugin {
    messageStore;
    registeredConfig;
    lidMappingStore;
    chatStateStore;
    type = plugins_1.PluginType.ENGINE;
    context;
    constructor(messageStore, registeredConfig, lidMappingStore, chatStateStore) {
        this.messageStore = messageStore;
        this.registeredConfig = registeredConfig;
        this.lidMappingStore = lidMappingStore;
        this.chatStateStore = chatStateStore;
    }
    onLoad(context) {
        this.context = context;
        context.logger.log('Baileys engine plugin loaded');
        return Promise.resolve();
    }
    onEnable(context) {
        context.logger.log('Baileys engine plugin enabled');
        return Promise.resolve();
    }
    onDisable(context) {
        context.logger.log('Baileys engine plugin disabled');
        return Promise.resolve();
    }
    createEngine(config) {
        const sessionId = config.sessionId;
        const dbSessionId = config.dbSessionId;
        const proxyUrl = config.proxyUrl;
        const engineConfig = (this.context?.config ?? this.registeredConfig ?? {});
        const authDir = config.authDir ?? engineConfig.baileys?.authDir ?? './data/baileys';
        return new baileys_adapter_1.BaileysAdapter({
            sessionId,
            dbSessionId,
            authDir,
            proxyUrl,
            messageStore: this.messageStore,
            lidMappingStore: this.lidMappingStore,
            chatStateStore: this.chatStateStore,
        });
    }
    getFeatures() {
        return [
            'text-messages',
            'typing-indicator',
            'media-messages',
            'location-messages',
            'contact-messages',
            'message-replies',
            'message-forwarding',
            'message-reactions',
            'message-deletion',
            'group-management',
            'read-receipts',
            'channels',
            'status-updates',
            'catalog',
        ];
    }
    getEngineLibrary() {
        let version = 'unknown';
        try {
            version = require('@whiskeysockets/baileys/package.json').version;
        }
        catch {
        }
        return { name: '@whiskeysockets/baileys', version };
    }
    healthCheck() {
        return Promise.resolve({ healthy: true, message: 'Baileys engine is available' });
    }
}
exports.BaileysPlugin = BaileysPlugin;
exports.default = BaileysPlugin;
//# sourceMappingURL=index.js.map