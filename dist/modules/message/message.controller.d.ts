import { StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { MessageService } from './message.service';
import { BulkMessageService } from './bulk-message.service';
import { SendTextMessageDto, SendMediaMessageDto, SendAudioMessageDto, MessageResponseDto } from './dto';
import { SendTemplateMessageDto } from './dto/send-template.dto';
import { SendBulkMessageDto, BulkMessageResponseDto } from './dto/bulk-message.dto';
import { SendLocationDto, SendContactDto, SendPollDto, ReplyMessageDto, ForwardMessageDto, ReactMessageDto, DeleteMessageDto, EditMessageDto, PinMessageDto, StarMessageDto, VotePollDto, ClickButtonDto, UnpinMessageDto } from './dto/message-actions.dto';
import { type ApiKey } from '../auth/entities/api-key.entity';
import { ChatScopeService } from '../auth/chat-scope.service';
export declare class MessageController {
    private readonly messageService;
    private readonly bulkMessageService;
    private readonly chatScope;
    constructor(messageService: MessageService, bulkMessageService: BulkMessageService, chatScope: ChatScopeService);
    getMessages(sessionId: string, chatId?: string, from?: string, limit?: string, offset?: string, after?: string, inlineMedia?: string, apiKey?: ApiKey, since?: string, until?: string, direction?: string, orderBy?: string, type?: string, messageId?: string): Promise<{
        messages: import("./entities/message.entity").Message[];
        total: number;
        unknownTimestampTotal?: number;
    }>;
    sendText(sessionId: string, dto: SendTextMessageDto): Promise<MessageResponseDto>;
    sendTemplate(sessionId: string, dto: SendTemplateMessageDto): Promise<MessageResponseDto>;
    sendImage(sessionId: string, dto: SendMediaMessageDto): Promise<MessageResponseDto>;
    sendVideo(sessionId: string, dto: SendMediaMessageDto): Promise<MessageResponseDto>;
    sendAudio(sessionId: string, dto: SendAudioMessageDto): Promise<MessageResponseDto>;
    sendDocument(sessionId: string, dto: SendMediaMessageDto): Promise<MessageResponseDto>;
    sendLocation(sessionId: string, dto: SendLocationDto): Promise<MessageResponseDto>;
    sendContact(sessionId: string, dto: SendContactDto): Promise<MessageResponseDto>;
    sendSticker(sessionId: string, dto: SendMediaMessageDto): Promise<MessageResponseDto>;
    sendPoll(sessionId: string, dto: SendPollDto): Promise<MessageResponseDto>;
    reply(sessionId: string, dto: ReplyMessageDto): Promise<MessageResponseDto>;
    clickButton(sessionId: string, dto: ClickButtonDto): Promise<MessageResponseDto>;
    forward(sessionId: string, dto: ForwardMessageDto): Promise<MessageResponseDto>;
    react(sessionId: string, dto: ReactMessageDto): Promise<{
        success: boolean;
    }>;
    getBatchStatus(sessionId: string, batchId: string): Promise<{
        batchId: string;
        status: import("./entities/message-batch.entity").BatchStatus;
        progress: import("./entities/message-batch.entity").BatchProgress;
        results: import("./entities/message-batch.entity").BatchMessageResult[];
        startedAt: Date | null;
        completedAt: Date | null;
    }>;
    cancelBatch(sessionId: string, batchId: string): Promise<{
        batchId: string;
        status: import("./entities/message-batch.entity").BatchStatus;
        progress: import("./entities/message-batch.entity").BatchProgress;
    }>;
    getChatHistory(sessionId: string, chatId: string, limit?: string, includeMedia?: string, deep?: string, res?: Response): Promise<import("../../engine/interfaces/whatsapp-engine.interface").IncomingMessage[]>;
    getReactions(sessionId: string, chatId: string, messageId: string): Promise<import("../../engine/interfaces/whatsapp-engine.interface").MessageReaction[]>;
    getChatMedia(sessionId: string, chatId: string, messageId: string, res: Response): Promise<StreamableFile>;
    deleteMessage(sessionId: string, dto: DeleteMessageDto): Promise<{
        success: boolean;
    }>;
    votePoll(sessionId: string, dto: VotePollDto): Promise<{
        success: boolean;
    }>;
    pinMessage(sessionId: string, dto: PinMessageDto): Promise<{
        success: boolean;
    }>;
    unpinMessage(sessionId: string, dto: UnpinMessageDto): Promise<{
        success: boolean;
    }>;
    starMessage(sessionId: string, dto: StarMessageDto): Promise<{
        success: boolean;
    }>;
    edit(sessionId: string, dto: EditMessageDto): Promise<MessageResponseDto>;
    sendBulk(sessionId: string, dto: SendBulkMessageDto): Promise<BulkMessageResponseDto>;
}
