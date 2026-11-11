import { Repository } from 'typeorm';
import type { WAMessage } from '@whiskeysockets/baileys';
import { BaileysStoredMessage } from './baileys-stored-message.entity';
import { BaileysMessageStore } from '../types/baileys.types';
export declare class BaileysMessageStoreService implements BaileysMessageStore {
    private readonly repo;
    private readonly logger;
    private readonly orphanWarnedSessions;
    private readonly pendingWrites;
    private readonly writes;
    private baileysLib?;
    private loadLib;
    constructor(repo: Repository<BaileysStoredMessage>);
    put(sessionId: string, msg: WAMessage): Promise<void>;
    update(sessionId: string, messageId: string, change: (stored: WAMessage) => WAMessage | null): Promise<void>;
    remove(sessionId: string, messageId: string, shouldRemove: (stored: WAMessage) => boolean): Promise<void>;
    private track;
    private write;
    getMessage(sessionId: string, messageId: string): Promise<WAMessage | null>;
    private readStored;
    getMessages(sessionId: string, messageIds: string[]): Promise<WAMessage[]>;
    private settled;
    clearSession(sessionId: string): Promise<void>;
    private enforceLimit;
}
