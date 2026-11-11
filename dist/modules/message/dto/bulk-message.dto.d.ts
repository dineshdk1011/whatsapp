import { BatchMessageStatus, BatchStatus } from '../entities/message-batch.entity';
declare class BulkMediaDto {
    url?: string;
    base64?: string;
    mimetype?: string;
    filename?: string;
    ptt?: boolean;
}
export declare class BulkMessageContentDto {
    text?: string;
    image?: BulkMediaDto;
    video?: BulkMediaDto;
    audio?: BulkMediaDto;
    document?: BulkMediaDto;
    caption?: string;
    mentions?: string[];
}
declare class BulkMessageItemDto {
    chatId: string;
    type: 'text' | 'image' | 'video' | 'audio' | 'document';
    content: BulkMessageContentDto;
    variables?: Record<string, string>;
}
declare class BulkMessageOptionsDto {
    delayBetweenMessages?: number;
    randomizeDelay?: boolean;
    stopOnError?: boolean;
}
export declare const BULK_MESSAGES_MAX = 100;
export declare class SendBulkMessageDto {
    batchId?: string;
    messages: BulkMessageItemDto[];
    options?: BulkMessageOptionsDto;
}
export declare class BulkMessageResponseDto {
    batchId: string;
    status: string;
    totalMessages: number;
    estimatedCompletionTime?: string;
    statusUrl: string;
}
export declare class BatchProgressDto {
    total: number;
    sent: number;
    failed: number;
    pending: number;
    cancelled: number;
}
export declare class BatchMessageErrorDto {
    code: string;
    message: string;
}
export declare class BatchMessageResultDto {
    chatId: string;
    status: BatchMessageStatus;
    messageId?: string;
    error?: BatchMessageErrorDto;
    sentAt?: Date;
}
export declare class BatchStatusResponseDto {
    batchId: string;
    status: BatchStatus;
    progress: BatchProgressDto;
    results: BatchMessageResultDto[];
    startedAt?: Date | null;
    completedAt?: Date | null;
}
export declare class BatchCancelResponseDto {
    batchId: string;
    status: BatchStatus;
    progress: BatchProgressDto;
}
export {};
