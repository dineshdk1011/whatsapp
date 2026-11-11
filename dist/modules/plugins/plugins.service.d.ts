import { ConfigService } from '@nestjs/config';
import { PluginLoaderService } from '../../core/plugins';
import { PluginDto } from './dto/plugin.dto';
import { CatalogPlugin } from './catalog';
export declare function isIngressCapable(manifest: {
    ingress?: unknown[];
    permissions?: string[];
}): boolean;
export declare class PluginsService {
    private readonly pluginLoader;
    private readonly configService;
    constructor(pluginLoader: PluginLoaderService, configService: ConfigService);
    private readonly opChains;
    private serialize;
    findAll(): PluginDto[];
    findOne(id: string): PluginDto;
    enable(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private enableInner;
    disable(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private disableInner;
    updateSessions(id: string, sessions: string[]): PluginDto;
    updateConfig(id: string, config: Record<string, unknown>): {
        success: boolean;
        message: string;
    };
    updateSessionConfig(id: string, sessionId: string, config: Record<string, unknown>): {
        success: boolean;
        message: string;
    };
    private redactSessionConfig;
    getConfigUiHtml(id: string): string;
    install(file?: {
        buffer?: Buffer;
    }): PluginDto;
    installFromUrl(url: string): Promise<PluginDto>;
    installPackage(file?: {
        buffer?: Buffer;
    }): Promise<PluginDto>;
    private downloadPackage;
    getCatalog(): Promise<CatalogPlugin[]>;
    updatePackage(id: string, buffer: Buffer): Promise<PluginDto>;
    private updatePackageInner;
    updateFromUrl(id: string, url: string): Promise<PluginDto>;
    uninstall(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private uninstallInner;
    healthCheck(id: string): Promise<{
        healthy: boolean;
        message?: string;
    }>;
}
