import { HostToWorkerMessage, WorkerToHostMessage } from './protocol';
import type { SearchQuery, SearchResults } from '../../../modules/search/search.types';
export type WorkerSearchHandler = (query: SearchQuery) => Promise<SearchResults> | SearchResults;
export declare class WorkerSearchRegistry {
    private readonly post;
    private handler?;
    private registered;
    constructor(post: (message: WorkerToHostMessage) => void);
    register(handler: WorkerSearchHandler): void;
    handleSearch(message: Extract<HostToWorkerMessage, {
        kind: 'search';
    }>): Promise<void>;
}
