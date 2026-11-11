type EnvConfig = Record<string, unknown>;
export declare function sqliteDataMainPathCollision(config: EnvConfig): string | null;
export declare function postgresSchemaError(schema: string): string | null;
export declare function builtinRedisTlsError(config: EnvConfig): string | null;
export declare function builtinRedisUsernameError(config: EnvConfig): string | null;
export declare function s3EndpointError(config: EnvConfig): string | null;
export declare function validateEnv(config: EnvConfig): EnvConfig;
export {};
