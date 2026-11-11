export declare const MENTIONS_DESCRIPTION = "WIDs to @mention (e.g. [\"62811@c.us\"]). The text/caption must also contain the @<number> token.";
export declare const MENTIONS_MAX = 1024;
export declare const MENTION_WID_MAX_LENGTH = 64;
export declare const CUSTOM_PREVIEW_URL_MAX_LENGTH = 2048;
export declare const CUSTOM_PREVIEW_TITLE_MAX_LENGTH = 256;
export declare const CUSTOM_PREVIEW_DESCRIPTION_MAX_LENGTH = 1024;
export declare const MESSAGE_TEXT_MAX_LENGTH = 4096;
export declare const CHAT_ID_MAX_LENGTH = 255;
export declare const BATCH_ID_MAX_LENGTH = 255;
export declare const CHAT_JID_PATTERN: RegExp;
export declare const CHAT_JID_MESSAGE = "chatId must be a valid chat JID in the form localpart@host";
export declare const BUTTON_ID_MAX_LENGTH = 256;
export declare const QUOTED_MESSAGE_ID_DESCRIPTION: string;
export declare const QUOTED_MESSAGE_ID_EXAMPLE = "true_628123456789@c.us_3EB0ABCD";
export declare class CustomLinkPreviewDto {
    url: string;
    title: string;
    description?: string;
    thumbnailUrl?: string;
    thumbnailBase64?: string;
}
export declare class SendTextMessageDto {
    chatId: string;
    text: string;
    mentions?: string[];
    linkPreview?: boolean;
    customLinkPreview?: CustomLinkPreviewDto;
    quotedMessageId?: string;
}
export declare const SEND_TEXT_BODY_EXAMPLES: {
    minimal: {
        summary: string;
        value: {
            chatId: string;
            text: string;
        };
    };
    withMentions: {
        summary: string;
        value: {
            chatId: string;
            text: string;
            mentions: string[];
        };
    };
};
export declare class SendMediaMessageDto {
    chatId: string;
    url?: string;
    base64?: string;
    mimetype?: string;
    filename?: string;
    caption?: string;
    mentions?: string[];
    quotedMessageId?: string;
}
export declare const SEND_IMAGE_BODY_EXAMPLES: {
    fromUrl: {
        summary: string;
        value: {
            chatId: string;
            url: string;
        };
    };
};
export declare const SEND_VIDEO_BODY_EXAMPLES: {
    fromUrl: {
        summary: string;
        value: {
            chatId: string;
            url: string;
        };
    };
};
export declare const SEND_AUDIO_BODY_EXAMPLES: {
    fromUrl: {
        summary: string;
        value: {
            chatId: string;
            url: string;
        };
    };
};
export declare const SEND_DOCUMENT_BODY_EXAMPLES: {
    fromUrl: {
        summary: string;
        value: {
            chatId: string;
            url: string;
        };
    };
};
export declare const SEND_STICKER_BODY_EXAMPLES: {
    fromUrl: {
        summary: string;
        value: {
            chatId: string;
            url: string;
        };
    };
};
export declare const SEND_LOCATION_BODY_EXAMPLES: {
    minimal: {
        summary: string;
        value: {
            chatId: string;
            latitude: number;
            longitude: number;
            description: string;
        };
    };
};
export declare const SEND_CONTACT_BODY_EXAMPLES: {
    minimal: {
        summary: string;
        value: {
            chatId: string;
            contactName: string;
            contactNumber: string;
        };
    };
};
export declare const SEND_POLL_BODY_EXAMPLES: {
    minimal: {
        summary: string;
        value: {
            chatId: string;
            name: string;
            options: string[];
        };
    };
};
export declare class SendAudioMessageDto extends SendMediaMessageDto {
    ptt?: boolean;
}
export declare class MessageResponseDto {
    messageId: string;
    timestamp: number;
}
