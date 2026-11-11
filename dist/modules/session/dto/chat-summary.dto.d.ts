import type { ChatKind } from '../../../engine/identity/wa-id';
import type { MessageType } from '../../../engine/interfaces/whatsapp-engine.interface';
export declare class ChatSummaryDto {
    id: string;
    name: string;
    isGroup: boolean;
    kind: ChatKind;
    unreadCount: number;
    timestamp: number;
    lastMessage?: string;
    lastMessageType?: MessageType;
    archived: boolean;
    pinned: boolean;
    muted: boolean;
    muteExpiration?: number;
}
