import { ChatScopeService } from '../auth/chat-scope.service';
import { ApiKey } from '../auth/entities/api-key.entity';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';
import type { SearchResults } from './search.types';
export declare class SearchController {
    private readonly searchService;
    private readonly chatScope;
    constructor(searchService: SearchService, chatScope: ChatScopeService);
    search(dto: SearchQueryDto, apiKey?: ApiKey): Promise<SearchResults>;
}
