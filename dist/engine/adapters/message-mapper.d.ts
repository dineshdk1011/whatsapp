import { EditedMessage, IncomingMessage, MessageContact, MessageType } from '../interfaces/whatsapp-engine.interface';
import { type SerializedWid } from '../types/whatsapp-web-js.types';
export declare const POLL_MAX_OPTIONS = 32;
export declare const POLL_TEXT_MAX_LENGTH = 1024;
export declare function boundPollText(text: string): string;
export declare function boundPollOptions(options: string[]): string[];
export declare function mapWwebjsMessageType(raw: string): MessageType;
export interface RawMessageFields {
    id: SerializedWid;
    from: string;
    to: string;
    body: string;
    type: string;
    timestamp: number;
    fromMe: boolean;
    author?: string;
    mentionedIds?: string[];
    _data?: {
        notifyName?: string;
        ephemeralDuration?: number;
    };
    orderId?: string;
    token?: string;
    productId?: string;
    pollName?: string;
    pollOptions?: Array<string | {
        name?: string;
    }>;
    allowMultipleAnswers?: boolean;
    title?: string;
    description?: string;
    businessOwnerJid?: string;
}
export declare function buildIncomingMessageBase(msg: RawMessageFields): IncomingMessage;
export declare function buildEditedMessage(message: IncomingMessage, hasMedia: boolean): EditedMessage;
export interface RawContactFields {
    id?: {
        _serialized?: string;
    };
    number?: string;
    name?: string;
    pushname?: string;
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
export declare function mapContactFields(contact: RawContactFields, full?: boolean): MessageContact;
