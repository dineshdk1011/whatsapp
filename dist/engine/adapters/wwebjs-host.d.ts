import { type Client, type Message } from 'whatsapp-web.js';
import { type EngineEventCallbacks, type InboundTicket, type IncomingMessage } from '../interfaces/whatsapp-engine.interface';
import { type createLogger } from '../../common/services/logger.service';
import { type WhatsAppWebJsConfig } from './whatsapp-web-js.adapter';
export interface WwebjsEngineHost {
    ensureReady(): void;
    getClient(): Client;
    readonly logger: ReturnType<typeof createLogger>;
    isPageTransportError(error: unknown): boolean;
    reportIfPageTransportError(error: unknown, context: string): void;
    reportOnceGone?(error: unknown, context: string): Promise<void>;
    ensureNotChannelRecipient(chatId: string): void;
    getNumberId(number: string): Promise<string | null>;
    capInboundMediaFor(msg: Message, maxBytesOverride?: number, ticket?: InboundTicket): Promise<IncomingMessage['media'] | undefined>;
    readonly config: WhatsAppWebJsConfig;
    getCallbacks(): EngineEventCallbacks;
}
export declare function requireClient(host: WwebjsEngineHost): Client;
export declare function rethrowIfNavigation(host: WwebjsEngineHost, error: unknown): void;
export declare function withPage<T>(host: WwebjsEngineHost, context: string, op: () => Promise<T>): Promise<T>;
export declare function reportPageDeath<T>(host: WwebjsEngineHost, context: string, op: () => Promise<T>): Promise<T>;
