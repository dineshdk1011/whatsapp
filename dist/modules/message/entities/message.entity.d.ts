import { ValueTransformer } from 'typeorm';
export declare const bigintToNumberTransformer: ValueTransformer;
export declare enum MessageDirection {
    INCOMING = "incoming",
    OUTGOING = "outgoing"
}
export declare enum MessageStatus {
    PENDING = "pending",
    SENT = "sent",
    DELIVERED = "delivered",
    READ = "read",
    FAILED = "failed"
}
export declare class Message {
    id: string;
    sessionId: string;
    waMessageId: string;
    chatId: string;
    chatName?: string;
    author?: string;
    from: string;
    to: string;
    body: string;
    type: string;
    direction: MessageDirection;
    timestamp: number;
    metadata: Record<string, unknown>;
    mediaPath?: string;
    mediaMimetype?: string;
    status: MessageStatus;
    createdAt: Date;
}
