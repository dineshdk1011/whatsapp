import { Repository } from 'typeorm';
import { Readable } from 'stream';
import { EngineRegistry } from '../../engine/engine-registry.service';
import { MessageProjector } from '../session/message-projector.service';
import { SendTextMessageDto, SendMediaMessageDto, SendAudioMessageDto, MessageResponseDto } from './dto';
import { SendTemplateMessageDto } from './dto/send-template.dto';
import { ReplyMessageDto, ClickButtonDto } from './dto/message-actions.dto';
import { Message } from './entities/message.entity';
import { HookManager } from '../../core/hooks';
import { SendPacingService } from './send-pacing.service';
import { LidMappingStoreService } from '../../engine/identity/lid-mapping-store.service';
import { ChatMediaArchiveService } from '../chat-media/chat-media-archive.service';
import { StorageService } from '../../common/storage/storage.service';
import { MessageSendService, SaveOutgoingMessageData } from './message-send.service';
import { SessionWriteScope } from '../../common/utils/session-write-scope';
import type { PluginMessagePort } from '../../core/plugins/plugin-host-ports';
import { MessageWindow } from './message-window';
export { DEFAULT_TEMPLATE_RENDER_MAX_CHARS } from './message-send.service';
export interface GetMessagesOptions extends MessageWindow {
    chatId?: string;
    from?: string;
    limit?: number;
    offset?: number;
    after?: string;
    inlineMedia?: boolean;
}
export declare const DEFAULT_MESSAGE_LIST_INLINE_MEDIA_BUDGET_BYTES: number;
export declare function resolveMessageListInlineMediaBudgetBytes(): number;
export declare function omitInlineMedia(media: {
    data: string;
    sizeBytes?: number;
}): Record<string, unknown>;
export declare function createInlineMediaSpender(budgetBytes: number): (message: Message) => void;
export declare function spendInlineMediaBudget(messages: Message[], budgetBytes: number): Message[];
export declare const DEFAULT_PIN_DURATION_SECONDS = 86400;
export declare class MessageService implements PluginMessagePort {
    private readonly messageRepository;
    private readonly engines;
    private readonly messageProjector;
    private readonly hookManager;
    private readonly lidMappingStore;
    private readonly pacing;
    private readonly sender;
    private readonly chatMediaArchive?;
    private readonly storageService?;
    private readonly logger;
    constructor(messageRepository: Repository<Message>, engines: EngineRegistry, messageProjector: MessageProjector, hookManager: HookManager, lidMappingStore: LidMappingStoreService, pacing: SendPacingService, sender: MessageSendService, chatMediaArchive?: ChatMediaArchiveService | undefined, storageService?: StorageService | undefined);
    private get orderTiebreak();
    private byPrimaryKey;
    sendText(sessionId: string, dto: SendTextMessageDto): Promise<MessageResponseDto>;
    sendTemplate(sessionId: string, dto: SendTemplateMessageDto): Promise<MessageResponseDto>;
    sendImage(sessionId: string, dto: SendMediaMessageDto): Promise<MessageResponseDto>;
    sendVideo(sessionId: string, dto: SendMediaMessageDto): Promise<MessageResponseDto>;
    sendAudio(sessionId: string, dto: SendAudioMessageDto): Promise<MessageResponseDto>;
    sendDocument(sessionId: string, dto: SendMediaMessageDto): Promise<MessageResponseDto>;
    sendLocation(sessionId: string, dto: {
        chatId: string;
        latitude: number;
        longitude: number;
        description?: string;
        address?: string;
        quotedMessageId?: string;
    }): Promise<MessageResponseDto>;
    sendContact(sessionId: string, dto: {
        chatId: string;
        contactName: string;
        contactNumber: string;
        quotedMessageId?: string;
    }): Promise<MessageResponseDto>;
    sendPoll(sessionId: string, dto: {
        chatId: string;
        name: string;
        options: string[];
        allowMultipleAnswers?: boolean;
        quotedMessageId?: string;
    }): Promise<MessageResponseDto>;
    sendSticker(sessionId: string, dto: SendMediaMessageDto): Promise<MessageResponseDto>;
    reply(sessionId: string, dto: ReplyMessageDto): Promise<MessageResponseDto>;
    clickButton(sessionId: string, dto: ClickButtonDto): Promise<MessageResponseDto>;
    forward(sessionId: string, dto: {
        fromChatId: string;
        toChatId: string;
        messageId: string;
    }): Promise<MessageResponseDto>;
    saveOutgoingMessage(sessionId: string, data: SaveOutgoingMessageData, lifetime?: SessionWriteScope): Promise<Message>;
    getMessages(sessionId: string, options?: GetMessagesOptions): Promise<{
        messages: Message[];
        total: number;
        unknownTimestampTotal?: number;
    }>;
    private readMetadataSizes;
    private readPageSpendingBudget;
    private resolveJidCandidates;
    reactToMessage(sessionId: string, dto: {
        chatId: string;
        messageId: string;
        emoji: string;
    }): Promise<void>;
    getMessageReactions(sessionId: string, chatId: string, messageId: string): Promise<import("../../engine/interfaces/whatsapp-engine.interface").MessageReaction[]>;
    getChatMedia(sessionId: string, chatId: string, messageId: string): Promise<{
        stream: Readable;
        size?: number;
        mimetype: string;
    }>;
    private static readonly MAX_CHAT_HISTORY_LIMIT;
    private static readonly MAX_DEEP_CHAT_HISTORY_LIMIT;
    getChatHistory(sessionId: string, chatId: string, limit?: number, includeMedia?: boolean, deep?: boolean, signal?: AbortSignal): Promise<import("../../engine/interfaces/whatsapp-engine.interface").IncomingMessage[]>;
    pinMessage(sessionId: string, dto: {
        chatId: string;
        messageId: string;
        durationSeconds?: number;
    }): Promise<{
        success: boolean;
    }>;
    unpinMessage(sessionId: string, dto: {
        chatId: string;
        messageId: string;
    }): Promise<{
        success: boolean;
    }>;
    starMessage(sessionId: string, dto: {
        chatId: string;
        messageId: string;
        star: boolean;
    }): Promise<{
        success: boolean;
    }>;
    votePoll(sessionId: string, dto: {
        chatId: string;
        pollMessageId: string;
        options: string[];
    }): Promise<{
        success: boolean;
    }>;
    deleteMessage(sessionId: string, dto: {
        chatId: string;
        messageId: string;
        forEveryone?: boolean;
    }): Promise<void>;
    editMessage(sessionId: string, dto: {
        chatId: string;
        messageId: string;
        body: string;
        mentions?: string[];
    }): Promise<MessageResponseDto>;
    private applySendingGate;
    private getEngine;
}
