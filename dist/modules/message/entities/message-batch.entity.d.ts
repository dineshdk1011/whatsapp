export declare enum BatchStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    FAILED = "failed"
}
export declare enum BatchMessageStatus {
    PENDING = "pending",
    SENT = "sent",
    FAILED = "failed",
    CANCELLED = "cancelled"
}
export interface BatchMessageResult {
    chatId: string;
    status: BatchMessageStatus;
    messageId?: string;
    error?: {
        code: string;
        message: string;
    };
    sentAt?: Date;
}
export interface BatchProgress {
    total: number;
    sent: number;
    failed: number;
    pending: number;
    cancelled: number;
}
export declare class MessageBatch {
    id: string;
    batchId: string;
    sessionId: string;
    status: BatchStatus;
    messages: Array<{
        chatId: string;
        type: string;
        content: Record<string, unknown>;
        variables?: Record<string, string>;
    }>;
    options: {
        delayBetweenMessages: number;
        randomizeDelay: boolean;
        stopOnError: boolean;
    };
    progress: BatchProgress;
    results: BatchMessageResult[];
    currentIndex: number;
    createdAt: Date;
    updatedAt: Date;
    startedAt: Date | null;
    completedAt: Date | null;
}
