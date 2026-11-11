export declare class DatabaseConfigDto {
    type?: 'sqlite' | 'postgres';
    builtIn?: boolean;
    host?: string;
    port?: string;
    username?: string;
    password?: string;
    database?: string;
    schema?: string;
    poolSize?: number;
    sslEnabled?: boolean;
    sslRejectUnauthorized?: boolean;
}
export declare class RedisConfigDto {
    enabled?: boolean;
    builtIn?: boolean;
    host?: string;
    port?: string;
    password?: string;
}
export declare class QueueConfigDto {
    enabled?: boolean;
}
export declare class StorageConfigDto {
    type?: 'local' | 's3';
    builtIn?: boolean;
    localPath?: string;
    s3Bucket?: string;
    s3Region?: string;
    s3AccessKey?: string;
    s3SecretKey?: string;
    s3Endpoint?: string;
}
export declare class EngineConfigDto {
    type?: string;
    headless?: boolean;
    sessionDataPath?: string;
    browserArgs?: string;
}
export declare class SaveConfigDto {
    database?: DatabaseConfigDto;
    redis?: RedisConfigDto;
    queue?: QueueConfigDto;
    storage?: StorageConfigDto;
    engine?: EngineConfigDto;
}
