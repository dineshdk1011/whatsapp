export interface CorsPolicy {
    origins: string[];
    allowAnyOrigin: boolean;
    credentials: boolean;
}
export declare function rewrittenCorsOrigins(corsOriginsEnv?: string): string[];
export declare function resolveCorsPolicy(corsOriginsEnv?: string, nodeEnv?: string): CorsPolicy;
export declare function isSwaggerEnabled(enableSwaggerEnv?: string, nodeEnv?: string): boolean;
export declare function isValidationErrorDetailEnabled(validationDetailEnv?: string, nodeEnv?: string): boolean;
export declare function isUpgradeInsecureRequestsEnabled(cspEnv?: string, nodeEnv?: string): boolean;
export declare function isDashboardCspUpgradeTrapLikely(env: {
    nodeEnv?: string;
    cspEnv?: string;
    dashboardServed: boolean;
}): boolean;
export declare function resolveBodyLimit(bodySizeEnv?: string): string;
export declare function isApiKeyPepperMissingInProduction(nodeEnv?: string, apiKeyPepper?: string): boolean;
export declare function isMainDbSynchronizeInProduction(nodeEnv?: string, mainDbSynchronize?: string): boolean;
export declare function isNodeEnvUnset(nodeEnv?: string): boolean;
export interface SecretCheckEnv {
    nodeEnv?: string;
    databaseType?: string;
    databasePassword?: string;
    postgresBuiltIn?: string;
    databaseHost?: string;
    storageType?: string;
    s3AccessKey?: string;
    s3SecretKey?: string;
    s3Endpoint?: string;
    minioBuiltIn?: string;
    apiMasterKey?: string;
    allowDevApiKey?: string;
    redisPassword?: string;
    metricsToken?: string;
}
export declare function assertNoDefaultSecretsInProduction(env: SecretCheckEnv): void;
