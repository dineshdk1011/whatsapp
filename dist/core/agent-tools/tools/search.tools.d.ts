import type { SearchService } from '../../../modules/search/search.service';
import { type AnyToolDescriptor } from '../tool-descriptor';
export declare function searchTools(search: SearchService | undefined, containsEnabled?: boolean): AnyToolDescriptor[];
