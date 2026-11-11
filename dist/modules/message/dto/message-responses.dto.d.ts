import type { MessageType } from '../../../engine/interfaces/whatsapp-engine.interface';
import type { ChatKind } from '../../../engine/identity/wa-id';
import { MessageDirection, MessageStatus } from '../entities/message.entity';
export declare class MessageActionResponseDto {
    success: boolean;
}
export declare class MessageListItemDto {
    id: string;
    sessionId: string;
    waMessageId?: string | null;
    chatId: string;
    chatName?: string | null;
    author?: string | null;
    from: string;
    to: string;
    body?: string | null;
    type: string;
    direction: MessageDirection;
    timestamp?: number | null;
    metadata?: {
        [key: string]: unknown;
    } | null;
    mediaPath?: string | null;
    mediaMimetype?: string | null;
    status: MessageStatus;
    createdAt: Date;
}
export declare class MessageListResponseDto {
    unknownTimestampTotal?: number;
    messages: MessageListItemDto[];
    total: number;
}
export declare class ChatHistoryContactDto {
    id?: string;
    number?: string;
    name?: string;
    pushName?: string;
    shortName?: string;
    type?: string;
    isMyContact?: boolean;
    isWAContact?: boolean;
    isBusiness?: boolean;
    isEnterprise?: boolean;
    verifiedName?: string;
    verifiedLevel?: number;
    isBlocked?: boolean;
    labels?: string[];
}
export declare class ChatHistoryMediaDto {
    mimetype: string;
    filename?: string;
    data?: string;
    omitted?: boolean;
    sizeBytes?: number;
}
export declare class ChatHistoryQuotedMessageDto {
    id: string;
    body: string;
}
export declare class ChatHistoryLocationDto {
    latitude: number;
    longitude: number;
    description?: string;
    address?: string;
    url?: string;
}
export declare class ChatHistoryCallDto {
    video: boolean;
    missed: boolean;
}
export declare class ChatHistoryOrderDto {
    orderId: string;
    token?: string;
}
export declare class ChatHistoryProductDto {
    productId: string;
    title?: string;
    description?: string;
    businessOwnerJid?: string;
}
export declare class ChatHistoryPollDto {
    name: string;
    options: string[];
    allowMultipleAnswers: boolean;
}
export declare class ChatHistoryMessageDto {
    id: string;
    from: string;
    to: string;
    chatId: string;
    body: string;
    type: MessageType;
    timestamp: number;
    fromMe: boolean;
    isGroup: boolean;
    kind: ChatKind;
    isStatusBroadcast?: boolean;
    ephemeralDuration?: number;
    author?: string;
    mentionedIds?: string[];
    call?: ChatHistoryCallDto;
    isLidSender?: boolean;
    senderPhone?: string | null;
    contact?: ChatHistoryContactDto;
    backgroundColor?: string;
    font?: number;
    media?: ChatHistoryMediaDto;
    quotedMessage?: ChatHistoryQuotedMessageDto;
    poll?: ChatHistoryPollDto;
    location?: ChatHistoryLocationDto;
    order?: ChatHistoryOrderDto;
    product?: ChatHistoryProductDto;
}
export declare class MessageReactionSenderDto {
    senderId: string;
    emoji: string;
    timestamp: number;
}
export declare class MessageReactionDto {
    emoji: string;
    senders: MessageReactionSenderDto[];
}
