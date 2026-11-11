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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineFactory = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const plugins_1 = require("../core/plugins");
const whatsapp_web_js_1 = require("./builtin/whatsapp-web-js");
const baileys_1 = require("./builtin/baileys");
const logger_service_1 = require("../common/services/logger.service");
const baileys_message_store_service_1 = require("./adapters/baileys-message-store.service");
const lid_mapping_store_service_1 = require("./identity/lid-mapping-store.service");
const baileys_chat_state_store_service_1 = require("./adapters/baileys-chat-state-store.service");
const path_safety_1 = require("../common/utils/path-safety");
const private_dir_util_1 = require("../common/utils/private-dir.util");
const auth_dir_paths_1 = require("./auth-dir-paths");
let EngineFactory = class EngineFactory {
    configService;
    pluginLoader;
    baileysMessageStore;
    lidMappingStore;
    chatStateStore;
    logger = (0, logger_service_1.createLogger)('EngineFactory');
    engineType;
    constructor(configService, pluginLoader, baileysMessageStore, lidMappingStore, chatStateStore) {
        this.configService = configService;
        this.pluginLoader = pluginLoader;
        this.baileysMessageStore = baileysMessageStore;
        this.lidMappingStore = lidMappingStore;
        this.chatStateStore = chatStateStore;
        this.engineType = this.configService.get('engine.type') ?? 'whatsapp-web.js';
    }
    async onModuleInit() {
        await this.registerBuiltInEngines();
    }
    async registerBuiltInEngines() {
        const engineConfig = this.configService.get('engine') ?? {};
        const wwjsManifest = {
            id: 'whatsapp-web.js',
            name: 'WhatsApp Web.js Engine',
            version: '1.0.0',
            type: plugins_1.PluginType.ENGINE,
            description: 'Official WhatsApp-web.js engine adapter',
            main: 'index.ts',
            provides: ['whatsapp-engine'],
        };
        const wwjsPlugin = new whatsapp_web_js_1.WhatsAppWebJsPlugin(engineConfig, this.lidMappingStore);
        this.pluginLoader.registerBuiltInPlugin(wwjsManifest, wwjsPlugin, engineConfig);
        const baileysManifest = {
            id: 'baileys',
            name: 'Baileys Engine',
            version: '1.0.0',
            type: plugins_1.PluginType.ENGINE,
            description: 'Baileys (WebSocket, no-browser) engine adapter',
            main: 'index.ts',
            provides: ['whatsapp-engine'],
        };
        this.pluginLoader.registerBuiltInPlugin(baileysManifest, new baileys_1.BaileysPlugin(this.baileysMessageStore, engineConfig, this.lidMappingStore, this.chatStateStore), engineConfig);
        try {
            await this.pluginLoader.enablePlugin(this.engineType);
            this.logger.log(`Engine plugin enabled: ${this.engineType}`, {
                action: 'engine_enabled',
                engineType: this.engineType,
            });
        }
        catch (error) {
            this.logger.error(`Failed to enable engine plugin: ${this.engineType}`, error instanceof Error ? error.message : String(error), { action: 'engine_enable_failed' });
        }
    }
    create(options) {
        if (!(0, path_safety_1.isSafeSessionName)(options.sessionId)) {
            throw new Error(`Refusing to create an engine for an unsafe session key: ${JSON.stringify(options.sessionId)}`);
        }
        (0, private_dir_util_1.ensurePrivateDir)(this.wwjsAuthDir(options.sessionId));
        (0, private_dir_util_1.ensurePrivateDir)(this.baileysAuthDir(options.sessionId));
        const enginePlugin = this.pluginLoader.getPlugin(this.engineType);
        if (enginePlugin?.instance && this.isEnginePlugin(enginePlugin.instance)) {
            return enginePlugin.instance.createEngine({
                sessionId: options.sessionId,
                dbSessionId: options.dbSessionId,
                proxyUrl: options.proxyUrl,
                proxyType: options.proxyType,
                sessionDataPath: this.sessionDataPath(),
                authDir: this.baileysAuthBase(),
            });
        }
        throw new Error(`Engine '${this.engineType}' is not registered; cannot start the session.`);
    }
    async purgeSessionData(sessionId, legacyName) {
        if (!(0, path_safety_1.isSafeSessionName)(sessionId)) {
            this.logger.warn('Refusing to purge session data for an unsafe session key', {
                action: 'engine_purge_unsafe',
                key: JSON.stringify(sessionId),
            });
            return;
        }
        await this.lidMappingStore.releaseSession(sessionId);
        const dirs = [
            { engine: 'whatsapp-web.js', dir: this.wwjsAuthDir(sessionId) },
            { engine: 'baileys', dir: this.baileysAuthDir(sessionId) },
        ];
        if (legacyName !== undefined && (0, path_safety_1.isSafeSessionName)(legacyName)) {
            const legacyDirs = [
                { engine: 'whatsapp-web.js', dir: this.wwjsAuthDir(legacyName) },
                { engine: 'baileys', dir: this.baileysAuthDir(legacyName) },
            ];
            dirs.push(...legacyDirs.filter(({ dir }) => this.authDirExists(dir)));
        }
        for (const { engine, dir } of dirs) {
            try {
                await fs.promises.rm(dir, { recursive: true, force: true });
                this.logger.log('Purged session auth directory', { action: 'engine_purge', engine, sessionId, dir });
            }
            catch (error) {
                this.logger.warn('Failed to purge session auth directory', {
                    action: 'engine_purge_failed',
                    engine,
                    sessionId,
                    dir,
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        }
    }
    sessionDataPath() {
        return this.configService.get('engine.sessionDataPath') ?? './data/sessions';
    }
    baileysAuthBase() {
        return this.configService.get('engine.baileys.authDir') ?? './data/baileys';
    }
    wwjsAuthDir(sessionId) {
        return (0, auth_dir_paths_1.wwjsAuthDir)(this.sessionDataPath(), sessionId);
    }
    baileysAuthDir(sessionId) {
        return (0, auth_dir_paths_1.baileysAuthDir)(this.baileysAuthBase(), sessionId);
    }
    authDirExists(dir) {
        try {
            return (0, auth_dir_paths_1.readAuthDirEntries)(path.dirname(dir)).has(path.basename(dir));
        }
        catch {
            return false;
        }
    }
    isEnginePlugin(instance) {
        return (typeof instance === 'object' &&
            instance !== null &&
            'type' in instance &&
            instance.type === plugins_1.PluginType.ENGINE &&
            'createEngine' in instance &&
            typeof instance.createEngine === 'function');
    }
    getAvailableEngines() {
        const enginePlugins = this.pluginLoader.getPluginsByType(plugins_1.PluginType.ENGINE);
        return enginePlugins.map(plugin => {
            const inst = plugin.instance;
            const features = inst && this.isEnginePlugin(inst) ? inst.getFeatures() : [];
            const library = inst && this.isEnginePlugin(inst) ? inst.getEngineLibrary?.() : undefined;
            return {
                id: plugin.manifest.id,
                name: plugin.manifest.name,
                enabled: this.pluginLoader.isPluginEnabled(plugin.manifest.id),
                features,
                library,
            };
        });
    }
    getCurrentEngine() {
        return this.engineType;
    }
};
exports.EngineFactory = EngineFactory;
exports.EngineFactory = EngineFactory = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        plugins_1.PluginLoaderService,
        baileys_message_store_service_1.BaileysMessageStoreService,
        lid_mapping_store_service_1.LidMappingStoreService,
        baileys_chat_state_store_service_1.ChatStateStoreService])
], EngineFactory);
//# sourceMappingURL=engine.factory.js.map