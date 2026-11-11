import type { EngineFactory } from '../../engine/engine.factory';
import { DatabaseConfigDto, EngineConfigDto, RedisConfigDto, StorageConfigDto } from './dto/save-config.dto';
export interface ConfigSectionContext {
    updates: Record<string, string>;
    staleKeys: Set<string>;
    profiles: string[];
}
export declare function applyDatabaseSection(database: DatabaseConfigDto, existing: Record<string, string>, ctx: ConfigSectionContext): void;
export declare function applyRedisSection(redis: RedisConfigDto, existing: Record<string, string>, ctx: ConfigSectionContext): void;
export declare function applyStorageSection(storage: StorageConfigDto, existing: Record<string, string>, ctx: ConfigSectionContext): void;
export declare function applyEngineSection(engine: EngineConfigDto, existing: Record<string, string>, ctx: ConfigSectionContext, engineFactory: EngineFactory): void;
