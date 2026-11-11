import { SearchProviderRegistry } from './search-provider.registry';
import type { SearchQuery, SearchResults } from './search.types';
import { ChatScopeService } from '../auth/chat-scope.service';
export declare class SearchService {
    private readonly registry;
    private readonly chatScope?;
    constructor(registry: SearchProviderRegistry, chatScope?: ChatScopeService | undefined);
    search(query: SearchQuery, callerSessionIds?: string[], callerChatIds?: string[]): Promise<SearchResults>;
    health(): Promise<import("./search.types").SearchHealth>;
}
