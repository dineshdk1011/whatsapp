import { ConfigService } from '@nestjs/config';
import { SearchProviderRegistry } from './search-provider.registry';
import { BuiltInFtsProvider } from './providers/builtin-fts.provider';
export declare function bootstrapSearchProviders(registry: SearchProviderRegistry, builtin: BuiltInFtsProvider, cfg: ConfigService): SearchProviderRegistry;
export declare class SearchModule {
}
