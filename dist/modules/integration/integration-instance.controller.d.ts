import { type ApiKey } from '../auth/entities/api-key.entity';
import { AuditService } from '../audit/audit.service';
import { PluginLoaderService } from '../../core/plugins/plugin-loader.service';
import { PluginInstanceService } from './plugin-instance.service';
import { ScopeBindingService } from './scope-binding.service';
import { CreateInstanceDto, InstanceView, UpdateInstanceDto } from './dto/instance.dto';
export declare class IntegrationInstanceController {
    private readonly instances;
    private readonly loader;
    private readonly audit;
    private readonly scopeBinding;
    constructor(instances: PluginInstanceService, loader: PluginLoaderService, audit: AuditService, scopeBinding: ScopeBindingService);
    create(pluginId: string, dto: CreateInstanceDto, apiKey?: ApiKey): Promise<InstanceView>;
    list(pluginId: string, apiKey?: ApiKey): Promise<InstanceView[]>;
    getOne(pluginId: string, instanceId: string, apiKey?: ApiKey): Promise<InstanceView>;
    regenerate(pluginId: string, instanceId: string, apiKey?: ApiKey): Promise<InstanceView>;
    patch(pluginId: string, instanceId: string, dto: UpdateInstanceDto, apiKey?: ApiKey): Promise<InstanceView>;
    remove(pluginId: string, instanceId: string, apiKey?: ApiKey): Promise<void>;
    private resolveVisible;
    private assertScopeWritable;
    private assertIngressCapable;
    private pluginRoutes;
    private schemaFor;
    private view;
}
