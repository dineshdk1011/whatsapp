import type { PluginConfigSchema, PluginI18n } from '../../../core/plugins';
import { PluginType, PluginStatus } from '../../../core/plugins';
export declare class PluginDto {
    id: string;
    name: string;
    version: string;
    type: PluginType;
    description?: string;
    author?: string;
    status: PluginStatus;
    config: Record<string, unknown>;
    builtIn: boolean;
    provides: string[];
    ingressCapable: boolean;
    sessionScoped: boolean;
    activeSessions: string[];
    configSchema?: PluginConfigSchema;
    configUi?: {
        entry: string;
        height?: number;
    };
    i18n?: PluginI18n;
    sessionConfig?: Record<string, Record<string, unknown>>;
    loadedAt?: string;
    enabledAt?: string;
    error?: string;
}
export declare class PluginConfigDto {
    config: Record<string, unknown>;
}
export declare class PluginSessionsDto {
    sessions: string[];
}
export declare class InstallFromUrlDto {
    url: string;
}
export declare class PluginActionResponseDto {
    success: boolean;
    message: string;
}
export declare class PluginHealthResponseDto {
    healthy: boolean;
    message?: string;
}
export declare class PluginCatalogEntryDto {
    id: string;
    name: string;
    version: string;
    type?: string;
    status?: string;
    description?: string;
    author?: string;
    license?: string;
    keywords?: string[];
    minOpenWAVersion?: string;
    testedOpenWAVersion?: string;
    releasedAt?: string;
    repoUrl?: string;
    homepage?: string;
    download?: string;
    installed: boolean;
    installedVersion: string | null;
    updateAvailable: boolean;
}
