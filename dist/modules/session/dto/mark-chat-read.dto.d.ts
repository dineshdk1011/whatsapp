export declare const MARK_READ_MESSAGE_IDS_MAX = 100;
export declare const MARK_READ_MESSAGE_ID_PATTERN: RegExp;
export declare const MARK_READ_MESSAGE_ID_MESSAGE = "each messageIds entry must be a non-empty id with no whitespace";
export declare class MarkChatReadDto {
    chatId: string;
    messageIds?: string[];
}
