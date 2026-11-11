"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppWebJsPlugin = void 0;
const plugins_1 = require("../../../core/plugins");
const whatsapp_web_js_adapter_1 = require("../../adapters/whatsapp-web-js.adapter");
class WhatsAppWebJsPlugin {
    registeredConfig;
    lidMappingStore;
    type = plugins_1.PluginType.ENGINE;
    context;
    constructor(registeredConfig, lidMappingStore) {
        this.registeredConfig = registeredConfig;
        this.lidMappingStore = lidMappingStore;
    }
    onLoad(context) {
        this.context = context;
        context.logger.log('WhatsApp-web.js engine plugin loaded');
        return Promise.resolve();
    }
    onEnable(context) {
        context.logger.log('WhatsApp-web.js engine plugin enabled');
        return Promise.resolve();
    }
    onDisable(context) {
        context.logger.log('WhatsApp-web.js engine plugin disabled');
        return Promise.resolve();
    }
    createEngine(config) {
        const sessionId = config.sessionId;
        const proxyUrl = config.proxyUrl;
        const proxyType = config.proxyType;
        const engineConfig = (this.context?.config ?? this.registeredConfig ?? {});
        const puppeteer = engineConfig.puppeteer ?? {};
        const sessionDataPath = config.sessionDataPath ?? engineConfig.sessionDataPath ?? './data/sessions';
        const headless = puppeteer.headless ?? true;
        const puppeteerArgs = puppeteer.args;
        const executablePath = puppeteer.executablePath;
        const protocolTimeoutMs = puppeteer.protocolTimeoutMs;
        return new whatsapp_web_js_adapter_1.WhatsAppWebJsAdapter({
            sessionId,
            sessionDataPath,
            puppeteer: {
                headless,
                args: puppeteerArgs,
                executablePath,
                protocolTimeoutMs,
            },
            proxy: proxyUrl
                ? {
                    url: proxyUrl,
                    type: proxyType ?? 'http',
                }
                : undefined,
            lidMappingStore: this.lidMappingStore,
        });
    }
    getFeatures() {
        return [
            'text-messages',
            'media-messages',
            'location-messages',
            'contact-messages',
            'group-management',
            'message-reactions',
            'message-replies',
            'message-forwarding',
            'message-deletion',
            'read-receipts',
            'typing-indicator',
            'labels',
            'channels',
            'status-updates',
        ];
    }
    getEngineLibrary() {
        let version = 'unknown';
        try {
            version = require('whatsapp-web.js/package.json').version;
        }
        catch {
        }
        return { name: 'whatsapp-web.js', version };
    }
    healthCheck() {
        return Promise.resolve({ healthy: true, message: 'WhatsApp-web.js engine is available' });
    }
}
exports.WhatsAppWebJsPlugin = WhatsAppWebJsPlugin;
exports.default = WhatsAppWebJsPlugin;
//# sourceMappingURL=index.js.map