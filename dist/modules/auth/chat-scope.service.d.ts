import { ApiKey } from './entities/api-key.entity';
import { LidMappingStoreService } from '../../engine/identity/lid-mapping-store.service';
import { ChatScope } from '../../common/security/chat-scope';
export declare class ChatScopeService {
    private readonly lidStore?;
    constructor(lidStore?: LidMappingStoreService | undefined);
    isRestricted(apiKey?: Pick<ApiKey, 'allowedChats'> | null): boolean;
    requireChat(apiKey: Pick<ApiKey, 'allowedChats'> | null | undefined, chatId: string | undefined): void;
    scopeFor(apiKey?: Pick<ApiKey, 'allowedChats'> | null): ChatScope | null;
    allows(apiKey: Pick<ApiKey, 'allowedChats'> | null | undefined, chatId: string): Promise<boolean>;
    candidatesFor(id: string): Promise<string[]>;
    scopeForFilter(apiKey?: Pick<ApiKey, 'allowedChats'> | null): Promise<ChatScope | null>;
    idsForFilter(apiKey?: Pick<ApiKey, 'allowedChats'> | null): Promise<string[] | undefined>;
    filter<T>(apiKey: Pick<ApiKey, 'allowedChats'> | null | undefined, items: readonly T[], chatIdOf: (item: T) => string | null | undefined): Promise<T[]>;
    private singleDirectory;
    private batchDirectory;
}
