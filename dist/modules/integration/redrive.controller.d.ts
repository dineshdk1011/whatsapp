import { type ApiKey } from '../auth/entities/api-key.entity';
import { AuditService } from '../audit/audit.service';
import { PluginInstanceService } from './plugin-instance.service';
import { RedriveService } from './redrive.service';
export declare class RedriveController {
    private readonly redrive;
    private readonly instances;
    private readonly audit;
    constructor(redrive: RedriveService, instances: PluginInstanceService, audit: AuditService);
    redriveInstance(pluginId: string, instanceId: string, apiKey?: ApiKey): Promise<{
        redriven: number;
        remaining: number;
        batchSize: number;
    }>;
}
