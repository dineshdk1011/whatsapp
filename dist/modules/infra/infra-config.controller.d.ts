import { RestartDto } from './dto/restart.dto';
import { EngineFactory } from '../../engine/engine.factory';
import { DockerService } from '../docker';
import { ShutdownService } from '../../common/services/shutdown.service';
import { AuditService } from '../audit/audit.service';
import { SaveConfigDto } from './dto/save-config.dto';
interface SavedConfigResponse {
    database: {
        type: 'sqlite' | 'postgres';
        builtIn: boolean;
        builtInSet: boolean;
        host: string;
        port: string;
        username: string;
        database: string;
        schema: string;
        poolSize: number;
        sslEnabled: boolean;
        sslRejectUnauthorized: boolean;
        passwordSet: boolean;
    };
    redis: {
        enabled: boolean;
        builtIn: boolean;
        builtInSet: boolean;
        host: string;
        port: string;
        passwordSet: boolean;
    };
    queue: {
        enabled: boolean;
    };
    storage: {
        type: 'local' | 's3';
        builtIn: boolean;
        builtInSet: boolean;
        localPath: string;
        s3Bucket: string;
        s3Region: string;
        s3Endpoint: string;
        s3CredentialsSet: boolean;
    };
    engine: {
        type: string;
        headless: boolean;
        sessionDataPath: string;
        browserArgs: string;
    };
}
export declare class InfraConfigController {
    private readonly engineFactory;
    private readonly dockerService;
    private readonly shutdownService;
    private readonly auditService?;
    private readonly logger;
    constructor(engineFactory: EngineFactory, dockerService: DockerService, shutdownService: ShutdownService, auditService?: AuditService | undefined);
    getConfig(): SavedConfigResponse;
    saveConfig(config: SaveConfigDto): {
        message: string;
        saved: boolean;
        envPath: string;
        profiles: string[];
    };
    private applyConfigSections;
    private assertNoLineBreakValues;
    private mergeWithExisting;
    private bootValueReader;
    private assertProductionBootable;
    private assertBootValidates;
    private assertStorageRootWritable;
    private persistGeneratedEnv;
    private overlayTarget;
    private auditConfigSaved;
    private buildSaveResponse;
    requestRestart(body?: RestartDto): Promise<{
        message: string;
        restarting: boolean;
        profiles: string[];
        profilesToRemove: string[];
        estimatedTime: number;
        orchestration?: object;
        removal?: object;
    }>;
}
export {};
