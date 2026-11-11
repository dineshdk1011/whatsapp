export declare class SendTemplateMessageDto {
    chatId: string;
    templateId?: string;
    templateName?: string;
    vars?: Record<string, string>;
    mentions?: string[];
    linkPreview?: boolean;
}
