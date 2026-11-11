import { PluginsService } from './plugins.service';
import { PluginDto, PluginConfigDto, PluginSessionsDto, InstallFromUrlDto } from './dto/plugin.dto';
import type { CatalogPlugin } from './catalog';
import { AuditService } from '../audit/audit.service';
export declare class PluginsController {
    private readonly pluginsService;
    private readonly audit;
    constructor(pluginsService: PluginsService, audit: AuditService);
    private record;
    private static sourceHost;
    findAll(): PluginDto[];
    install(file: {
        buffer?: Buffer;
    }): Promise<PluginDto>;
    installFromUrl(dto: InstallFromUrlDto): Promise<PluginDto>;
    catalog(): Promise<CatalogPlugin[]>;
    findOne(id: string): PluginDto;
    enable(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    disable(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    updateConfig(id: string, configDto: PluginConfigDto): {
        success: boolean;
        message: string;
    };
    getConfigUi(id: string): string;
    updateSessionConfig(id: string, sessionId: string, configDto: PluginConfigDto): {
        success: boolean;
        message: string;
    };
    updateSessions(id: string, dto: PluginSessionsDto): PluginDto;
    update(id: string, dto: InstallFromUrlDto): Promise<PluginDto>;
    uninstall(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    healthCheck(id: string): Promise<{
        healthy: boolean;
        message?: string;
    }>;
}
