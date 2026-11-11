import { ContactDirectory } from '../../engine/identity/jid-candidates';
export interface ChatScope {
    allowed: Set<string>;
}
export interface ChatScopeDirectory {
    phonesForLids(lids: string[]): Promise<Record<string, string | null>>;
    lidsForPhones(phones: string[]): Promise<Record<string, string[]>>;
}
export declare function isChatScopeRestricted(allowedChats: string[] | null | undefined): boolean;
export declare function normalizeChatAllowList(list: string[] | null | undefined): string[] | null;
export declare function buildChatScope(allowedChats: string[] | null | undefined): ChatScope | null;
export declare function chatScopeAllows(scope: ChatScope | null, chatId: string): boolean;
export declare function chatIdAllowed(scope: ChatScope | null, chatId: string, directory?: ContactDirectory): Promise<boolean>;
export declare function buildExpandedChatScope(allowedChats: string[] | null | undefined, directory?: ChatScopeDirectory): Promise<ChatScope | null>;
export declare function filterByChatScope<T>(scope: ChatScope | null, items: readonly T[], chatIdOf: (item: T) => string | null | undefined): T[];
