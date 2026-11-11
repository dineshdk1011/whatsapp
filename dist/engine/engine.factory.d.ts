import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IWhatsAppEngine } from './interfaces/whatsapp-engine.interface';
import { PluginLoaderService } from '../core/plugins';
import { BaileysMessageStoreService } from './adapters/baileys-message-store.service';
import { LidMappingStoreService } from './identity/lid-mapping-store.service';
import { ChatStateStoreService } from './adapters/baileys-chat-state-store.service';
export interface EngineCreateOptions {
    sessionId: string;
    dbSessionId: string;
    proxyUrl?: string;
    proxyType?: 'http' | 'https' | 'socks4' | 'socks5';
}
export declare class EngineFactory implements OnModuleInit {
    private readonly configService;
    private readonly pluginLoader;
    private readonly baileysMessageStore;
    private readonly lidMappingStore;
    private readonly chatStateStore;
    private readonly logger;
    private readonly engineType;
    constructor(configService: ConfigService, pluginLoader: PluginLoaderService, baileysMessageStore: BaileysMessageStoreService, lidMappingStore: LidMappingStoreService, chatStateStore: ChatStateStoreService);
    onModuleInit(): Promise<void>;
    private registerBuiltInEngines;
    create(options: EngineCreateOptions): IWhatsAppEngine;
    purgeSessionData(sessionId: string, legacyName?: string): Promise<void>;
    private sessionDataPath;
    private baileysAuthBase;
    private wwjsAuthDir;
    private baileysAuthDir;
    private authDirExists;
    private isEnginePlugin;
    getAvailableEngines(): Array<{
        id: string;
        name: string;
        enabled: boolean;
        features: string[];
        library?: {
            name: string;
            version: string;
        };
    }>;
    getCurrentEngine(): string;
}
