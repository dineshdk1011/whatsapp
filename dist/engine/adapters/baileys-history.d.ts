import type * as BaileysLib from '@whiskeysockets/baileys';
import type { Chat, Contact as BaileysContact, WAMessage, WAMessageKey, WASocket } from '@whiskeysockets/baileys';
import { EngineEventCallbacks, MessageType } from '../interfaces/whatsapp-engine.interface';
import { type createLogger } from '../../common/services/logger.service';
export interface BaileysHistoryHost {
    getSocket(): WASocket;
    readonly logger: ReturnType<typeof createLogger>;
    toNeutralJid(jid: string): string;
    findPersistedLidPhone?(jid: string): Promise<string | null>;
    normalizedSelfJid(): string;
    loadLib(): Promise<typeof BaileysLib>;
    recordMessage(msg: WAMessage, type?: MessageType, order?: number): void;
    recordMessageEdit(chatId: string, messageId: string, text: string, type?: MessageType): void;
    applyHistoryRevoke(target: WAMessageKey, envelope: WAMessageKey): Promise<WAMessageKey | undefined>;
    upsertContacts(records: Partial<BaileysContact>[]): void;
    upsertChats(records: Partial<Chat>[]): void;
    contactCount(): number;
    extractEphemeralDuration(msg: WAMessage): number | undefined;
    getOnHistoryMessages(): EngineEventCallbacks['onHistoryMessages'];
    getStoredWriteGeneration?(): number;
}
export declare function toUnixSeconds(ts: number | string | {
    toNumber(): number;
} | null | undefined): number;
export declare class BaileysHistory {
    private readonly host;
    constructor(host: BaileysHistoryHost);
    private addressbookRestored;
    private sock;
    captureHistoryMessages(messages: WAMessage[]): Promise<void>;
    private revokedMessage;
    hydrateNames(): Promise<void>;
    private static readonly ADDRESSBOOK_COLLECTION;
    restoreAddressbookSnapshot(): Promise<void>;
    private mapHistoryMessage;
}
