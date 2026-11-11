import { HookManager, HookEvent, HookHandler } from '../hooks';
import type { MessageResponseDto } from '../../modules/message/dto';
import type { IWhatsAppEngine } from '../../engine/interfaces/whatsapp-engine.interface';
import type { PluginNetRequestInit, PluginNetResponse } from './plugin-net';
import type { HandoverState } from '../../modules/integration/entities/conversation-mapping.entity';
import type { WebhookRequest, WebhookResponse, WebhookHandler } from './sandbox/worker-webhooks';
export type { WebhookRequest, WebhookResponse, WebhookHandler };
export declare enum PluginType {
    ENGINE = "engine",
    STORAGE = "storage",
    QUEUE = "queue",
    AUTH = "auth",
    EXTENSION = "extension"
}
export declare enum PluginStatus {
    INSTALLED = "installed",
    ENABLED = "enabled",
    DISABLED = "disabled",
    ERROR = "error"
}
export interface PluginManifest {
    id: string;
    name: string;
    version: string;
    type: PluginType;
    description?: string;
    author?: string;
    homepage?: string;
    repository?: string;
    license?: string;
    main: string;
    dependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
    configSchema?: PluginConfigSchema;
    configUi?: {
        entry: string;
        height?: number;
    };
    hooks?: HookEvent[];
    provides?: string[];
    requires?: string[];
    permissions?: string[];
    sessions?: string[];
    sessionScoped?: boolean;
    net?: {
        allow?: string[];
        allowConfigHosts?: string[];
    };
    i18n?: PluginI18n;
    sdkVersion?: string;
    minOpenWAVersion?: string | null;
    ingress?: PluginIngressRoute[];
}
export interface PluginI18nText {
    title?: string;
    description?: string;
}
export interface PluginI18nLocale {
    name?: string;
    description?: string;
    config?: Record<string, PluginI18nText>;
}
export type PluginI18n = Record<string, PluginI18nLocale>;
export interface PluginConfigField {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'textarea';
    title?: string;
    description?: string;
    default?: unknown;
    enum?: unknown[];
    required?: boolean;
    secret?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
    items?: PluginConfigField;
    properties?: Record<string, PluginConfigField>;
}
export interface PluginConfigSchema {
    type: 'object';
    properties: Record<string, PluginConfigField>;
}
export declare const PluginCapabilityPermission: {
    readonly MESSAGES_SEND: "messages:send";
    readonly ENGINE_READ: "engine:read";
    readonly NET_FETCH: "net:fetch";
    readonly STORAGE_USE: "storage:use";
    readonly WEBHOOK_INGRESS: "webhook:ingress";
    readonly CONVERSATION_SEND: "conversation:send";
    readonly SEARCH_PROVIDE: "search:provide";
};
export type PluginCapabilityPermission = (typeof PluginCapabilityPermission)[keyof typeof PluginCapabilityPermission];
export interface IngressSignatureSpec {
    scheme: 'hmac-sha256' | 'shared-secret' | 'standard-webhooks' | 'none';
    header?: string;
    contentTemplate?: string;
    encoding?: 'hex' | 'base64';
    prefix?: string;
    timestampHeader?: string;
    toleranceSec?: number;
    dedupHeader?: string;
}
export interface IngressChallengeSpec {
    method: 'GET';
    tokenParam: string;
    echoParam: string;
}
export type IngressPreflightCheck = {
    type: 'session-alive';
};
export interface IngressResponseContract {
    preflight?: IngressPreflightCheck[];
    ack?: {
        status?: number;
        body?: string;
        headers?: Record<string, string>;
    };
    deadlineMs?: number;
}
export interface PluginIngressRoute {
    route: string;
    mode: 'async' | 'sync-reply';
    signature: IngressSignatureSpec;
    challenge?: IngressChallengeSpec;
    verify: 'core' | 'self';
    maxBodyBytes: number;
    conversationId?: {
        header?: string;
        jsonPointer?: string;
    };
    dedupOn?: 'header' | 'body';
    response?: IngressResponseContract;
}
export interface ConversationSendEnvelope {
    sessionId?: string;
    instanceId?: string;
    chatId?: string;
    type: 'text' | 'image' | 'file' | 'audio' | 'video' | 'voice' | 'location';
    text?: string;
    mediaUrl?: string;
    replyTo?: string;
    linkPreview?: boolean;
    latitude?: number;
    longitude?: number;
    source?: {
        provider: string;
        externalConversationId: string;
    };
}
export declare const SUPPORTED_SDK_MAJOR = 1;
export declare function validateIngressManifest(manifest: PluginManifest, allowUnsignedIngress?: boolean): void;
export declare function warnUnauthenticatedIngressRoutes(manifest: PluginManifest, logger: {
    warn: (message: string, context?: Record<string, unknown>) => void;
}): void;
export declare function warnUnsignedTimestampRoutes(manifest: PluginManifest, logger: {
    warn: (message: string, context?: Record<string, unknown>) => void;
}): void;
export declare class PluginCapabilityError extends Error {
    constructor(message: string);
}
export interface PluginMessagingCapability {
    sendText(sessionId: string, chatId: string, text: string): Promise<MessageResponseDto>;
    reply(sessionId: string, chatId: string, quotedMessageId: string, text: string): Promise<MessageResponseDto>;
}
export interface PluginEngineReadCapability {
    getGroupInfo(sessionId: string, groupId: string): ReturnType<IWhatsAppEngine['getGroupInfo']>;
    getContacts(sessionId: string): ReturnType<IWhatsAppEngine['getContacts']>;
    getContactById(sessionId: string, contactId: string): ReturnType<IWhatsAppEngine['getContactById']>;
    checkNumberExists(sessionId: string, phone: string): ReturnType<IWhatsAppEngine['checkNumberExists']>;
    getChats(sessionId: string): ReturnType<IWhatsAppEngine['getChats']>;
    getChatHistory(sessionId: string, chatId: string, limit?: number, includeMedia?: boolean): ReturnType<IWhatsAppEngine['getChatHistory']>;
    canonicalChatId(sessionId: string, chatId: string): Promise<string>;
}
export interface PluginNetCapability {
    fetch(url: string, init?: PluginNetRequestInit): Promise<PluginNetResponse>;
}
export interface PluginConversationsCapability {
    send(env: ConversationSendEnvelope): Promise<unknown>;
}
export interface PluginHandoverCapability {
    set(key: {
        sessionId: string;
        chatId: string;
        instanceId: string;
    }, state: HandoverState): Promise<unknown>;
}
export interface PluginMappingsCapability {
    upsert(key: {
        sessionId: string;
        chatId: string;
        instanceId: string;
    }, providerConversationId: string): Promise<void>;
    get(key: {
        sessionId: string;
        chatId: string;
        instanceId: string;
    }): Promise<{
        providerConversationId: string;
        handoverState: HandoverState;
    } | null>;
    getByProvider(instanceId: string, providerConversationId: string): Promise<{
        sessionId: string;
        chatId: string;
        handoverState: HandoverState;
    } | null>;
}
export interface PluginContext {
    pluginId: string;
    manifest: PluginManifest;
    config: Record<string, unknown>;
    hookManager: HookManager;
    logger: PluginLogger;
    storage: PluginStorage;
    registerHook: (event: HookEvent, handler: HookHandler, priority?: number) => void;
    registerWebhook: (route: string, handler: WebhookHandler) => void;
    messages: PluginMessagingCapability;
    engine: PluginEngineReadCapability;
    net: PluginNetCapability;
    conversations: PluginConversationsCapability;
    handover: PluginHandoverCapability;
    mappings: PluginMappingsCapability;
}
export interface PluginLogger {
    log: (message: string, meta?: Record<string, unknown>) => void;
    debug: (message: string, meta?: Record<string, unknown>) => void;
    warn: (message: string, meta?: Record<string, unknown>) => void;
    error: (message: string, error?: unknown, meta?: Record<string, unknown>) => void;
}
export interface PluginStorage {
    get: <T = unknown>(key: string) => Promise<T | null>;
    set: <T = unknown>(key: string, value: T) => Promise<void>;
    delete: (key: string) => Promise<void>;
    list: (prefix?: string) => Promise<string[]>;
}
export interface IPlugin {
    onLoad?: (context: PluginContext) => Promise<void>;
    onEnable?: (context: PluginContext) => Promise<void>;
    onDisable?: (context: PluginContext) => Promise<void>;
    onUnload?: (context: PluginContext) => Promise<void>;
    onConfigChange?: (context: PluginContext, newConfig: Record<string, unknown>) => Promise<void>;
    healthCheck?: () => Promise<{
        healthy: boolean;
        message?: string;
    }>;
}
export interface IEnginePlugin extends IPlugin {
    type: PluginType.ENGINE;
    createEngine: (config: Record<string, unknown>) => unknown;
    getFeatures: () => string[];
    getEngineLibrary?: () => {
        name: string;
        version: string;
    };
}
export interface PluginInstance {
    manifest: PluginManifest;
    status: PluginStatus;
    config: Record<string, unknown>;
    instance: IPlugin | null;
    error?: string;
    loadedAt?: Date;
    enabledAt?: Date;
    activeSessions?: string[];
    sessionConfig?: Record<string, Record<string, unknown>>;
    builtIn?: boolean;
    packageDir?: string;
}
export interface PluginRegistryEntry {
    id: string;
    type: PluginType;
    name: string;
    version: string;
    status: PluginStatus;
    config: Record<string, unknown>;
    builtIn: boolean;
    installedAt: Date;
    updatedAt: Date;
    activeSessions?: string[];
    sessionConfig?: Record<string, Record<string, unknown>>;
    enabledByOperator?: boolean;
}
