import { OnApplicationBootstrap } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { PluginLoaderService } from '../../core/plugins/plugin-loader.service';
import { Session } from '../session/entities/session.entity';
import { PluginInstanceService } from './plugin-instance.service';
export declare class ScopeBindingService implements OnApplicationBootstrap {
    private readonly instances;
    private readonly loader;
    private readonly audit;
    private readonly sessions;
    private readonly logger;
    constructor(instances: PluginInstanceService, loader: PluginLoaderService, audit: AuditService, sessions: Repository<Session>);
    onApplicationBootstrap(): Promise<void>;
    reconcile(): Promise<void>;
    resyncAfterImport(previous: ReadonlyArray<{
        pluginId: string;
        sessionScope: string | null;
        enabled: boolean;
    }>): Promise<void>;
    private warnIfScopeHasNoSession;
    applyScopeBinding(pluginId: string, scope: string | null, config: Record<string, unknown>, activate: boolean, opts?: {
        additive?: boolean;
        previousConfig?: Record<string, unknown> | null;
    }): Promise<void>;
    private retractedSecrets;
}
