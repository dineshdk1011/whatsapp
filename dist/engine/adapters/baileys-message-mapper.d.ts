import type { proto } from '@whiskeysockets/baileys';
import { DeliveryStatus, EventResponseKind, IncomingMessage, MessageType } from '../interfaces/whatsapp-engine.interface';
export declare const BAILEYS_NON_CONTENT_TYPES: ReadonlySet<string>;
export declare function mapBaileysEventResponseType(type: number | null | undefined): EventResponseKind;
export declare function mapBaileysMessageType(contentType: string | undefined, isPtt?: boolean, isCatalogShare?: boolean): MessageType;
export interface BaileysBodyContent {
    conversation?: string | null;
    extendedTextMessage?: {
        text?: string | null;
    } | null;
    imageMessage?: {
        caption?: string | null;
    } | null;
    videoMessage?: {
        caption?: string | null;
    } | null;
    documentMessage?: {
        caption?: string | null;
    } | null;
    interactiveMessage?: {
        body?: {
            text?: string | null;
        } | null;
    } | null;
    buttonsMessage?: {
        contentText?: string | null;
    } | null;
    templateMessage?: {
        hydratedTemplate?: {
            hydratedContentText?: string | null;
        } | null;
        hydratedFourRowTemplate?: {
            hydratedContentText?: string | null;
        } | null;
    } | null;
    interactiveResponseMessage?: {
        body?: {
            text?: string | null;
        } | null;
    } | null;
    listMessage?: {
        description?: string | null;
        title?: string | null;
    } | null;
    pollCreationMessage?: {
        name?: string | null;
    } | null;
    pollCreationMessageV2?: {
        name?: string | null;
    } | null;
    pollCreationMessageV3?: {
        name?: string | null;
    } | null;
    pollCreationMessageV5?: {
        name?: string | null;
    } | null;
    pollCreationMessageV4?: {
        message?: PollCreationKeys<{
            name?: string | null;
        }> | null;
    } | null;
    eventMessage?: {
        name?: string | null;
    } | null;
    buttonsResponseMessage?: {
        selectedDisplayText?: string | null;
    } | null;
    templateButtonReplyMessage?: {
        selectedDisplayText?: string | null;
    } | null;
    listResponseMessage?: {
        title?: string | null;
    } | null;
    contactMessage?: {
        vcard?: string | null;
    } | null;
    contactsArrayMessage?: {
        contacts?: Array<{
            vcard?: string | null;
        }> | null;
    } | null;
    orderMessage?: {
        message?: string | null;
        orderTitle?: string | null;
    } | null;
    productMessage?: {
        body?: string | null;
        product?: {
            title?: string | null;
        } | null;
        catalog?: {
            title?: string | null;
        } | null;
    } | null;
}
interface PollCreationKeys<P> {
    pollCreationMessage?: P | null;
    pollCreationMessageV2?: P | null;
    pollCreationMessageV3?: P | null;
    pollCreationMessageV5?: P | null;
}
export declare function extractBaileysBody(content: BaileysBodyContent): string;
export declare function baileysMessageText(message: unknown): string;
export declare function setBaileysText(content: Pick<BaileysBodyContent, 'conversation' | 'extendedTextMessage' | 'imageMessage' | 'videoMessage' | 'documentMessage'>, text: string): boolean;
export interface BaileysCommerceContent {
    orderMessage?: {
        orderId?: string | null;
        token?: string | null;
    } | null;
    productMessage?: {
        businessOwnerJid?: string | null;
        product?: {
            productId?: string | null;
            title?: string | null;
            description?: string | null;
        } | null;
        catalog?: {
            title?: string | null;
        } | null;
    } | null;
}
export interface BaileysCommerce {
    order?: IncomingMessage['order'];
    product?: IncomingMessage['product'];
}
export declare function extractBaileysCommerce(content: BaileysCommerceContent, contentType: string | undefined): BaileysCommerce;
export interface BaileysButtonReplyContent {
    buttonsResponseMessage?: {
        selectedButtonId?: string | null;
        selectedDisplayText?: string | null;
    } | null;
    templateButtonReplyMessage?: {
        selectedId?: string | null;
        selectedDisplayText?: string | null;
    } | null;
    listResponseMessage?: {
        title?: string | null;
        singleSelectReply?: {
            selectedRowId?: string | null;
        } | null;
    } | null;
    interactiveResponseMessage?: {
        body?: {
            text?: string | null;
        } | null;
        nativeFlowResponseMessage?: {
            name?: string | null;
            paramsJson?: string | null;
        } | null;
    } | null;
}
export declare function extractBaileysButtonReply(content: BaileysButtonReplyContent, contentType: string | undefined): IncomingMessage['button'];
interface BaileysHydratedTemplateButton {
    index?: number | null;
    quickReplyButton?: {
        id?: string | null;
        displayText?: string | null;
    } | null;
    urlButton?: {
        url?: string | null;
        displayText?: string | null;
    } | null;
    callButton?: {
        phoneNumber?: string | null;
        displayText?: string | null;
    } | null;
}
export interface BaileysButtonsPromptContent {
    buttonsMessage?: {
        buttons?: Array<{
            buttonId?: string | null;
            buttonText?: {
                displayText?: string | null;
            } | null;
            nativeFlowInfo?: {
                name?: string | null;
            } | null;
        } | null> | null;
    } | null;
    interactiveMessage?: {
        nativeFlowMessage?: {
            buttons?: Array<{
                name?: string | null;
                buttonParamsJson?: string | null;
            } | null> | null;
        } | null;
    } | null;
    templateMessage?: {
        hydratedTemplate?: {
            hydratedButtons?: Array<BaileysHydratedTemplateButton | null> | null;
        } | null;
        hydratedFourRowTemplate?: {
            hydratedButtons?: Array<BaileysHydratedTemplateButton | null> | null;
        } | null;
    } | null;
    listMessage?: {
        sections?: Array<{
            rows?: Array<{
                rowId?: string | null;
                title?: string | null;
            } | null> | null;
        } | null> | null;
    } | null;
}
export declare const BUTTONS_MAX_ENTRIES = 20;
export declare const BUTTON_TEXT_MAX_LENGTH = 256;
export interface BaileysClickableChoice {
    id: string;
    text: string;
    index?: number;
}
export declare function extractBaileysButtons(content: BaileysButtonsPromptContent, contentType: string | undefined): IncomingMessage['buttons'];
export type BaileysButtonClickError = 'not_a_prompt' | 'unknown_button';
export interface BaileysButtonClickPayload {
    id: string;
    text: string;
    index?: number;
    content: Record<string, unknown>;
}
export declare function resolveBaileysButtonClick(content: BaileysButtonsPromptContent, contentType: string | undefined, buttonId: string, text?: string): {
    ok: true;
    payload: BaileysButtonClickPayload;
} | {
    ok: false;
    error: BaileysButtonClickError;
};
export declare function extractBaileysClickableButtons(content: BaileysButtonsPromptContent, contentType: string | undefined): BaileysClickableChoice[] | undefined;
export declare function toBaileysButtonClickContent(contentType: string, buttonId: string, text: string, index: number | undefined): Record<string, unknown>;
export declare function isBaileysCatalogShare(content: BaileysCommerceContent): boolean;
export interface BaileysLocationContent {
    locationMessage?: {
        degreesLatitude?: number | null;
        degreesLongitude?: number | null;
        name?: string | null;
        address?: string | null;
    } | null;
    liveLocationMessage?: {
        degreesLatitude?: number | null;
        degreesLongitude?: number | null;
    } | null;
}
export declare function extractBaileysLocation(content: BaileysLocationContent, contentType: string | undefined): IncomingMessage['location'];
interface BaileysContextCarrier {
    contextInfo?: {
        stanzaId?: string | null;
        quotedMessage?: unknown;
        expiration?: number | null;
        mentionedJid?: string[] | null;
    } | null;
}
export interface BaileysContextContent {
    extendedTextMessage?: (BaileysContextCarrier & {
        backgroundArgb?: number | null;
        font?: number | null;
    }) | null;
    imageMessage?: BaileysContextCarrier | null;
    videoMessage?: BaileysContextCarrier | null;
    ptvMessage?: BaileysContextCarrier | null;
    audioMessage?: BaileysContextCarrier | null;
    documentMessage?: BaileysContextCarrier | null;
    stickerMessage?: BaileysContextCarrier | null;
    locationMessage?: BaileysContextCarrier | null;
    buttonsResponseMessage?: BaileysContextCarrier | null;
    templateButtonReplyMessage?: BaileysContextCarrier | null;
    listResponseMessage?: BaileysContextCarrier | null;
    interactiveResponseMessage?: BaileysContextCarrier | null;
    contactMessage?: BaileysContextCarrier | null;
    contactsArrayMessage?: BaileysContextCarrier | null;
    liveLocationMessage?: BaileysContextCarrier | null;
    pollCreationMessage?: BaileysContextCarrier | null;
    pollCreationMessageV2?: BaileysContextCarrier | null;
    pollCreationMessageV3?: BaileysContextCarrier | null;
    pollCreationMessageV5?: BaileysContextCarrier | null;
    pollCreationMessageV4?: {
        message?: object | null;
    } | null;
}
export interface BaileysMessageContext {
    quotedMessage?: IncomingMessage['quotedMessage'];
    ephemeralDuration?: number;
    mentionedJids?: string[];
    backgroundArgb?: number;
    font?: number;
}
export declare function extractBaileysContext(content: BaileysContextContent): BaileysMessageContext;
export declare function mapBaileysStatus(status: number | null | undefined): DeliveryStatus | null;
export declare function extractBaileysPoll(content: proto.IMessage): IncomingMessage['poll'];
export interface BaileysIncomingFields {
    id: string;
    remoteJid: string;
    fromMe: boolean;
    participant?: string;
    body: string;
    contentType: string | undefined;
    isPtt?: boolean;
    timestamp: number;
    pushName?: string;
    selfJid?: string;
    media?: IncomingMessage['media'];
    location?: IncomingMessage['location'];
    quotedMessage?: IncomingMessage['quotedMessage'];
    order?: IncomingMessage['order'];
    product?: IncomingMessage['product'];
    poll?: IncomingMessage['poll'];
    button?: IncomingMessage['button'];
    buttons?: IncomingMessage['buttons'];
    isCatalogShare?: boolean;
    ephemeralDuration?: number;
    mentionedJids?: string[];
    backgroundArgb?: number;
    font?: number;
}
export declare function baileysChatJid(remoteJid: string, participant: string | null | undefined, fromMe: boolean): string;
export declare function storedKeyInChat(key: {
    remoteJid?: string | null;
    participant?: string | null;
    fromMe?: boolean | null;
}, chatId: string, neutral: (jid: string) => string): boolean;
export declare function storedKeyInChatPersisted(key: {
    remoteJid?: string | null;
    participant?: string | null;
    fromMe?: boolean | null;
}, chatId: string, resolveLid?: (jid: string) => Promise<string | null>): Promise<boolean>;
export declare function keyParticipant(key: {
    participant?: string | null;
}): string | undefined;
export declare function buildIncomingMessageFromBaileys(fields: BaileysIncomingFields, normalizeJid?: (jid: string) => string): IncomingMessage;
export {};
