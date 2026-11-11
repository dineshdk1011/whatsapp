import type * as BaileysLib from '@whiskeysockets/baileys';
import type { WACallEvent, WAMessage, WAMessageKey, WASocket } from '@whiskeysockets/baileys';
import { Contact, EngineEventCallbacks, InboundTicket, PresenceState, IncomingMessage, MessageType } from '../interfaces/whatsapp-engine.interface';
import type { Dispatcher } from 'undici';
import type { ConcurrencyLimiter } from '../../common/utils/concurrency-limiter';
import { type createLogger } from '../../common/services/logger.service';
interface RawPresence {
    lastKnownPresence?: PresenceState;
    lastSeen?: number;
    groupOnlineCount?: number;
}
export declare function differentWaIds(a: ReadonlyArray<string | null | undefined>, b: ReadonlyArray<string | null | undefined>, toNeutralJid: (jid: string) => string): boolean;
export declare function isWhatsAppMediaSource(b: Pick<typeof BaileysLib, 'extractMessageContent' | 'getContentType'>, message: WAMessage['message']): boolean;
export interface BaileysEventsHost {
    getSocket(): WASocket;
    getSocketOrNull(): WASocket | null;
    readonly logger: ReturnType<typeof createLogger>;
    toNeutralJid(jid: string): string;
    normalizedSelfJid(): string;
    loadLib(): Promise<typeof BaileysLib>;
    getFetchDispatcher(): Dispatcher | undefined;
    readonly inboundLimiter: ConcurrencyLimiter;
    recordKeyLidMappings(key: Pick<WAMessageKey, 'remoteJid' | 'remoteJidAlt' | 'participant' | 'participantAlt' | 'fromMe'>): void;
    recordMessage(msg: WAMessage, type?: MessageType, order?: number): void;
    nextMessageOrder?(): number;
    recordMessageEdit(chatId: string, messageId: string, text: string, type?: MessageType, accept?: (key: WAMessageKey) => boolean): void;
    findPersistedLidPhone?(jid: string): Promise<string | null>;
    putStoredMessage(msg: WAMessage): Promise<void> | undefined;
    updateStoredMessage(messageId: string, change: (stored: WAMessage) => WAMessage | null): Promise<void> | undefined;
    consumeOwnSend(id: string | null | undefined): boolean;
    removeStoredMessage(messageId: string, shouldRemove: (stored: WAMessage) => boolean): Promise<void> | undefined;
    getStoredMessage(messageId: string): Promise<WAMessage | null> | undefined;
    getAdmitInbound?(): EngineEventCallbacks['admitInbound'];
    getLoadedLib?(): typeof BaileysLib | undefined;
    getOnMessage(): EngineEventCallbacks['onMessage'];
    getOnMessageCreate(): EngineEventCallbacks['onMessageCreate'];
    getOnMessageRevoked(): EngineEventCallbacks['onMessageRevoked'];
    getOnMessageEdited(): EngineEventCallbacks['onMessageEdited'];
    getOnMessageReaction(): EngineEventCallbacks['onMessageReaction'];
    getOnMessageAck(): EngineEventCallbacks['onMessageAck'];
    getOnMessageReceipt(): EngineEventCallbacks['onMessageReceipt'];
    getOnGroupEvent(): EngineEventCallbacks['onGroupEvent'];
    getOnEventResponse(): EngineEventCallbacks['onEventResponse'];
    findContact(contactId: string): Contact | null;
    getOnCall(): EngineEventCallbacks['onCall'];
    getOnPresenceUpdate(): EngineEventCallbacks['onPresenceUpdate'];
    getOnCallOutcome(): EngineEventCallbacks['onCallOutcome'];
}
interface BaileysMessageUpdate {
    key?: {
        id?: string | null;
        remoteJid?: string | null;
        fromMe?: boolean | null;
    };
    update?: {
        status?: number | null;
        eventResponses?: BaileysEventResponse[] | null;
    };
}
interface BaileysEventResponse {
    eventResponseMessageKey?: WAMessageKey | null;
    senderTimestampMs?: number | {
        toNumber(): number;
    } | null;
    response?: {
        response?: number | null;
        timestampMs?: number | {
            toNumber(): number;
        } | null;
        extraGuestCount?: number | null;
    } | null;
}
interface LiveCallHandle {
    callFrom: string;
    expiresAt: number;
    from: string;
    isVideo: boolean;
    isGroup: boolean;
}
declare class LiveCallMap<V> extends Map<string, V> {
    clears: number;
    clear(): void;
}
export declare class BaileysEvents {
    private readonly host;
    private static readonly LIVE_CALL_TTL_MS;
    readonly liveCalls: LiveCallMap<LiveCallHandle>;
    private readonly rejections;
    static readonly DELETED_FOR_EVERYONE_LIMIT = 5000;
    private readonly inboundInFlight;
    private readonly deletedForEveryone;
    private readonly editedWhileInFlight;
    private readonly outcomesPending;
    private readonly changesAwaitingEmit;
    private changesParked;
    private changesAwaiting;
    private readonly messageChanges;
    private changesPreparing;
    private preparationRoom?;
    private retirePreparations;
    private preparationsRetired;
    private static readonly CHANGES_PARKED_LIMIT;
    private readonly copyRemovals;
    private static readonly OUTCOME_HOLD_MS;
    private storeGeneration;
    constructor(host: BaileysEventsHost);
    getStoredWriteGeneration(): number;
    fenceStoredWrites(): void;
    wasDeletedForEveryone(messageId: string): boolean;
    pendingEditOf(messageId: string, target: WAMessageKey): string | undefined;
    markDeletedForEveryone(messageId: string): void;
    applyHistoryRevoke(target: WAMessageKey, envelope: WAMessageKey): Promise<WAMessageKey | undefined>;
    handleMessagesUpsert(event: {
        messages: WAMessage[];
        type: string;
    }): void;
    private mergedAck;
    private namesAnotherMessage;
    private admitInbound;
    plannedMediaDownload(b: typeof BaileysLib | undefined, msg: WAMessage): boolean;
    logContactEvent(event: string, records?: Array<{
        id?: string;
        name?: string;
        notify?: string;
        verifiedName?: string;
        lid?: string;
        jid?: string;
    }>): void;
    private recordPreviewChange;
    private previewAuthor;
    private processInboundMessage;
    private prepareMessageChange;
    private processMessageChange;
    private applyMessageChange;
    private announceWhenHandedOn;
    private handOverChanges;
    private watchOutcome;
    private holdOutcome;
    private dropConflictingCopy;
    private removalsOf;
    private readTarget;
    private readStoredMessage;
    private revealEncryptedModification;
    private targetsForeignMessage;
    private parkUntil;
    private readsAsForeign;
    private changeStoredMessage;
    private reportedPhones;
    private mayChange;
    handleMessagesUpdate(updates: BaileysMessageUpdate[]): void;
    handleMessageReceiptUpdate(updates: Array<{
        key?: {
            id?: string | null;
            remoteJid?: string | null;
            fromMe?: boolean | null;
        };
        receipt?: {
            userJid?: string | null;
            receiptTimestamp?: number | {
                toNumber(): number;
            } | null;
            readTimestamp?: number | {
                toNumber(): number;
            } | null;
            playedTimestamp?: number | {
                toNumber(): number;
            } | null;
        };
    }>): void;
    private selfMatcher;
    private emitEventResponse;
    handleGroupParticipantsUpdate(event: {
        id?: string;
        author?: string;
        authorPn?: string;
        participants?: unknown[];
        action?: string;
    }): void;
    handleGroupsUpsert(groups: Array<{
        id?: string;
        author?: string;
        authorPn?: string;
        owner?: string;
        ownerPn?: string;
    }>): void;
    handleGroupJoinRequest(event: {
        id?: string;
        author?: string;
        authorPn?: string;
        participant?: string;
        participantPn?: string;
        action?: string;
        method?: string;
    }): void;
    handleGroupsUpdate(updates: Array<{
        id?: string;
        subject?: string;
        desc?: string;
        announce?: boolean;
        restrict?: boolean;
        author?: string;
        authorPn?: string;
        participants?: unknown;
        creation?: unknown;
        subjectTime?: unknown;
        owner?: unknown;
        size?: unknown;
    }>): void;
    handleCallEvents(calls: WACallEvent[]): void;
    private reportCallOutcome;
    handlePresenceUpdate(update: {
        id?: string;
        presences?: Record<string, RawPresence>;
    }): void;
    private cacheLiveCall;
    private isPending;
    rejectCall(callId: string): Promise<void>;
    private toNeutralGroupParticipantId;
    private downloadInboundMediaCapped;
    private resolveInboundMedia;
    mapMessage(msg: WAMessage, contentType: string | undefined, opts?: {
        skipMediaDownload?: boolean;
        ticket?: InboundTicket;
        yieldSlot?: <R>(fn: () => Promise<R>) => Promise<R>;
    }): Promise<IncomingMessage>;
    private toEditUnixSeconds;
}
export {};
