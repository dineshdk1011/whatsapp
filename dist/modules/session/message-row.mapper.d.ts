import type { IncomingMessage } from '../../engine/interfaces/whatsapp-engine.interface';
import type { QueryDeepPartialEntity } from 'typeorm';
import type { Message } from '../message/entities/message.entity';
export declare const REVOKED_ROW_PATCH: QueryDeepPartialEntity<Message>;
export declare const MEDIA_MESSAGE_TYPES: Set<string>;
export declare const OMITTED_MEDIA: {
    readonly mimetype: "";
    readonly omitted: true;
};
export declare function buildMessageMetadata(message: Pick<IncomingMessage, 'media' | 'quotedMessage' | 'call' | 'buttons' | 'poll' | 'type'>, synthesizeOmittedMedia?: boolean): Record<string, unknown> | undefined;
export declare function storableWaMessageId(id: string | undefined): string | undefined;
