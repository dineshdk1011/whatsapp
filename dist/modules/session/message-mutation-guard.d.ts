import { MessageDirection } from '../message/entities/message.entity';
export interface StoredMessageRef {
    chatId: string;
    direction: MessageDirection;
    author?: string | null;
}
export interface MutationSource {
    kind: 'edit' | 'revoke' | 'reaction';
    chatId: string;
    fromMe?: boolean;
    author?: string;
}
export declare function phoneKey(local: string): string;
export declare function provablyDifferent(a?: string | null, b?: string | null, resolveLid?: (jid: string) => string | null): boolean;
export declare function mutationTargetsForeignRow(row: StoredMessageRef, source: MutationSource, resolveLid?: (jid: string) => string | null): 'chat' | 'direction' | 'author' | null;
export declare function mutationTargetsForeignRowPersisted(row: StoredMessageRef, source: MutationSource, resolveLid?: (jid: string) => Promise<string | null>): Promise<'chat' | 'direction' | 'author' | null>;
export declare function receiptTargetsForeignRow(row: StoredMessageRef, chatId: string, resolveLid?: (jid: string) => string | null): boolean;
export declare function receiptTargetsForeignRowPersisted(row: StoredMessageRef, chatId: string, resolveLid?: (jid: string) => Promise<string | null>): Promise<boolean>;
