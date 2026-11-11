import { MessageMedia, type Message } from 'whatsapp-web.js';
import { CustomLinkPreview, IncomingMessage, LocationInput, ContactCard, DeliveryStatus, MediaInput, MessageReaction, MessageResult, PollInput, Quotable } from '../interfaces/whatsapp-engine.interface';
import { type WwebjsEngineHost } from './wwebjs-host';
export declare function wwebjsAckToDeliveryStatus(ack: number): DeliveryStatus;
export declare function extractWwebjsCall(msg: Message): {
    video: boolean;
    missed: boolean;
} | undefined;
export declare function declaredOnlyMedia(msg: Message): IncomingMessage['media'];
export declare function declaredMediaSize(msg: Message): number;
export declare function plannedInboundDownload(msg: Message): boolean;
export interface PageMediaDownload {
    mimetype: string;
    filename?: string;
    data: string;
    sizeBytes: number;
}
export declare function downloadMediaInPage(args: {
    msgId: string;
    maxBytes: number;
}): Promise<PageMediaDownload | null | undefined>;
export declare function downloadCappedMedia(msg: Message, maxBytes: number): Promise<PageMediaDownload | null | undefined>;
export declare function isHttpUrl(value: string): boolean;
export declare function loadRemoteMedia(url: string, sessionProxyUrl: string | undefined): Promise<MessageMedia>;
export declare function isNoLidForUserError(err: unknown): boolean;
export declare function isQuoteUnresolvedError(err: unknown): boolean;
export declare function toMessageMedia(media: MediaInput, sessionProxyUrl: string | undefined, opts?: {
    trustDeclaredType?: boolean;
    fallbackType?: string;
}): Promise<MessageMedia>;
export declare function toMessageResult(msg: Message | undefined): MessageResult;
export declare class WwebjsMessaging {
    private readonly host;
    constructor(host: WwebjsEngineHost);
    private client;
    private ensureReadyToSend;
    private withPage;
    private readBeforeSend;
    private readonly resolvedSendIds;
    private readonly unreportedLids;
    resolveSendId(chatId: string): Promise<string>;
    private lookupSendId;
    private unansweredLookup;
    private reportLid;
    private quoteOptions;
    private sendResolved;
    sendTextMessage(chatId: string, text: string, mentions?: string[], options?: {
        linkPreview?: boolean;
        customPreview?: CustomLinkPreview;
    } & Quotable): Promise<MessageResult>;
    sendImageMessage(chatId: string, media: MediaInput): Promise<MessageResult>;
    sendVideoMessage(chatId: string, media: MediaInput): Promise<MessageResult>;
    sendAudioMessage(chatId: string, media: MediaInput): Promise<MessageResult>;
    sendDocumentMessage(chatId: string, media: MediaInput): Promise<MessageResult>;
    private sendMediaMessage;
    sendLocationMessage(chatId: string, location: LocationInput): Promise<MessageResult>;
    sendContactMessage(chatId: string, contact: ContactCard): Promise<MessageResult>;
    sendStickerMessage(chatId: string, media: MediaInput): Promise<MessageResult>;
    sendPollMessage(chatId: string, poll: PollInput): Promise<MessageResult>;
    replyToMessage(chatId: string, quotedMsgId: string, text: string, mentions?: string[]): Promise<MessageResult>;
    forwardMessage(fromChatId: string, toChatId: string, messageId: string): Promise<MessageResult>;
    private loadedOwnMessages;
    reactToMessage(chatId: string, messageId: string, emoji: string): Promise<void>;
    getMessageReactions(chatId: string, messageId: string): Promise<MessageReaction[]>;
    getChatHistory(chatId: string, limit?: number, includeMedia?: boolean, mediaMaxBytes?: number, signal?: AbortSignal): Promise<IncomingMessage[]>;
    deleteMessage(chatId: string, messageId: string, forEveryone?: boolean): Promise<void>;
    editMessage(chatId: string, messageId: string, body: string, mentions?: string[]): Promise<MessageResult>;
    private findInFetchWindow;
    votePoll(chatId: string, pollMessageId: string, options: string[]): Promise<void>;
    pinMessage(chatId: string, messageId: string, durationSeconds: number): Promise<void>;
    starMessage(chatId: string, messageId: string, star: boolean): Promise<void>;
    unpinMessage(chatId: string, messageId: string): Promise<void>;
}
