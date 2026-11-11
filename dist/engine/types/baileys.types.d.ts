import type { WAMessage } from '@whiskeysockets/baileys';
import type { LidMappingStore } from '../identity/lid-mapping-store.service';
import type { ChatStateStore } from '../adapters/baileys-chat-state-store.service';
export interface BaileysMessageStore {
    put(sessionId: string, msg: WAMessage): Promise<void>;
    getMessage(sessionId: string, messageId: string): Promise<WAMessage | null>;
    getMessages(sessionId: string, messageIds: string[]): Promise<WAMessage[]>;
    update(sessionId: string, messageId: string, change: (stored: WAMessage) => WAMessage | null): Promise<void>;
    remove(sessionId: string, messageId: string, shouldRemove: (stored: WAMessage) => boolean): Promise<void>;
    clearSession(sessionId: string): Promise<void>;
}
export interface BaileysAdapterConfig {
    sessionId: string;
    dbSessionId: string;
    authDir: string;
    proxyUrl?: string;
    messageStore?: BaileysMessageStore;
    lidMappingStore?: LidMappingStore;
    chatStateStore?: ChatStateStore;
}
export interface BaileysLogger {
    level: string;
    child: (bindings: Record<string, unknown>) => BaileysLogger;
    trace: (obj: unknown, msg?: string) => void;
    debug: (obj: unknown, msg?: string) => void;
    info: (obj: unknown, msg?: string) => void;
    warn: (obj: unknown, msg?: string) => void;
    error: (obj: unknown, msg?: string) => void;
}
