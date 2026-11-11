export declare class InfraDatabaseStatusDto {
    connected: boolean;
    type: string;
    host: string;
    builtIn: boolean;
    running?: boolean;
}
export declare class InfraRedisStatusDto {
    enabled: boolean;
    connected: boolean;
    host: string;
    port: number;
    builtIn: boolean;
    running?: boolean;
}
export declare class InfraQueueDepthDto {
    pending: number;
    completed: number;
    failed: number;
}
export declare class InfraQueueStatusDto {
    enabled: boolean;
    webhooks: InfraQueueDepthDto;
}
export declare class InfraStorageStatusDto {
    type: string;
    path?: string;
    bucket?: string;
    endpoint?: string;
    builtIn: boolean;
    running?: boolean;
    s3Available?: boolean;
}
export declare class InfraEngineStatusDto {
    type: string;
    headless: boolean;
    sessionDataPath: string;
    browserArgs: string;
    webVersion?: string | null;
    webVersionSource?: string;
}
export declare class InfraStatusResponseDto {
    database: InfraDatabaseStatusDto;
    redis: InfraRedisStatusDto;
    queue: InfraQueueStatusDto;
    storage: InfraStorageStatusDto;
    engine: InfraEngineStatusDto;
    envPinned: string[];
}
export declare class InfraHealthResponseDto {
    status: string;
    timestamp: string;
}
export declare class EngineLibraryDto {
    name: string;
    version: string;
}
export declare class AvailableEngineDto {
    id: string;
    name: string;
    enabled: boolean;
    features: string[];
    library?: EngineLibraryDto;
}
export declare class InfraCurrentEngineResponseDto {
    engineType: string;
}
export declare class InfraUpdateCheckResponseDto {
    current: string;
    latest: string | null;
    updateAvailable: boolean;
    releaseUrl: string | null;
}
export declare class InfraConfigDatabaseDto {
    type: string;
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
}
export declare class InfraConfigRedisDto {
    enabled: boolean;
    builtIn: boolean;
    builtInSet: boolean;
    host: string;
    port: string;
    passwordSet: boolean;
}
export declare class InfraConfigQueueDto {
    enabled: boolean;
}
export declare class InfraConfigStorageDto {
    type: string;
    builtIn: boolean;
    builtInSet: boolean;
    localPath: string;
    s3Bucket: string;
    s3Region: string;
    s3Endpoint: string;
    s3CredentialsSet: boolean;
}
export declare class InfraConfigEngineDto {
    type: string;
    headless: boolean;
    sessionDataPath: string;
    browserArgs: string;
}
export declare class InfraConfigResponseDto {
    database: InfraConfigDatabaseDto;
    redis: InfraConfigRedisDto;
    queue: InfraConfigQueueDto;
    storage: InfraConfigStorageDto;
    engine: InfraConfigEngineDto;
}
export declare class InfraConfigSaveResponseDto {
    message: string;
    saved: boolean;
    envPath: string;
    profiles: string[];
}
export declare class InfraRestartResponseDto {
    message: string;
    restarting: boolean;
    profiles: string[];
    profilesToRemove: string[];
    estimatedTime: number;
    orchestration?: object;
    removal?: object;
}
export declare class MigrationTablesDto {
    sessions: object[];
    webhooks: object[];
    messages: object[];
    messageBatches: object[];
    templates: object[];
    baileysStoredMessages: object[];
    lidMappings: object[];
    chatStates: object[];
    pluginInstances: object[];
    conversationMappings: object[];
    ingressEvents: object[];
    webhookDeliveryFailures: object[];
    webhookOutboxEvents: object[];
    integrationDeliveryFailures: object[];
    statusUpdates: object[];
    automationRules: object[];
}
export declare class TableCountsDto {
    sessions: number;
    webhooks: number;
    messages: number;
    messageBatches: number;
    templates: number;
    baileysStoredMessages: number;
    lidMappings: number;
    chatStates: number;
    pluginInstances: number;
    conversationMappings: number;
    ingressEvents: number;
    webhookDeliveryFailures: number;
    webhookOutboxEvents: number;
    integrationDeliveryFailures: number;
    statusUpdates: number;
    automationRules: number;
}
export declare class OmittedInlineMediaDto {
    messages: number;
    messageBatches: number;
}
export declare class InfraExportDataResponseDto {
    exportedAt: string;
    dataDbType: string;
    tables: MigrationTablesDto;
    counts: TableCountsDto;
    skippedTables: string[];
    omittedInlineMedia: OmittedInlineMediaDto;
}
export declare class InfraImportDataResponseDto {
    imported: boolean;
    counts: TableCountsDto;
    warnings: string[];
    notices: string[];
    restartRequired: boolean;
    orphanedEngines: string[];
    stoppedOrphanEngines: string[];
    failedOrphanEngines: string[];
}
export declare class StorageFileCountResponseDto {
    storageType: string;
    count: number;
    sizeBytes: number;
    sizeMB: string;
}
export declare class StorageExportResponseDto {
    message: string;
    download: string;
}
export declare class StorageImportResponseDto {
    imported: boolean;
    count: number;
    failed: number;
    storageType: string;
}
