export declare const LOCATION_TEXT_MAX_LENGTH = 1024;
export declare const CONTACT_NAME_MAX_LENGTH = 255;
export declare const CONTACT_NUMBER_MAX_LENGTH = 30;
export declare const REACTION_EMOJI_MAX_LENGTH = 32;
export declare class SendLocationDto {
    chatId: string;
    latitude: number;
    longitude: number;
    description?: string;
    address?: string;
    quotedMessageId?: string;
}
export declare class SendContactDto {
    chatId: string;
    contactName: string;
    contactNumber: string;
    quotedMessageId?: string;
}
export declare class SendPollDto {
    chatId: string;
    name: string;
    options: string[];
    allowMultipleAnswers?: boolean;
    quotedMessageId?: string;
}
export declare class ReplyMessageDto {
    chatId: string;
    quotedMessageId: string;
    text: string;
    mentions?: string[];
}
export declare class ForwardMessageDto {
    fromChatId: string;
    toChatId: string;
    messageId: string;
}
export declare class ReactMessageDto {
    chatId: string;
    messageId: string;
    emoji: string;
}
export declare class DeleteMessageDto {
    chatId: string;
    messageId: string;
    forEveryone?: boolean;
}
export declare const PIN_DURATIONS_SECONDS: readonly [86400, 604800, 2592000];
export declare class PinMessageDto {
    chatId: string;
    messageId: string;
    durationSeconds?: number;
}
export declare const POLL_VOTE_MAX_OPTIONS = 12;
export declare class VotePollDto {
    chatId: string;
    pollMessageId: string;
    options: string[];
}
export declare class ClickButtonDto {
    chatId: string;
    messageId: string;
    buttonId: string;
    text?: string;
}
export declare class StarMessageDto {
    chatId: string;
    messageId: string;
    star: boolean;
}
export declare class UnpinMessageDto {
    chatId: string;
    messageId: string;
}
export declare class EditMessageDto {
    chatId: string;
    messageId: string;
    body: string;
    mentions?: string[];
}
