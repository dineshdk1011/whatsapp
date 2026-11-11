declare const SERVICES: {
    readonly database: {
        readonly flag: "POSTGRES_BUILTIN";
        readonly host: "DATABASE_HOST";
        readonly profile: "postgres";
        readonly selection: "DATABASE_TYPE";
        readonly selected: "postgres";
    };
    readonly redis: {
        readonly flag: "REDIS_BUILTIN";
        readonly host: "REDIS_HOST";
        readonly profile: "redis";
        readonly selection: "REDIS_ENABLED";
        readonly selected: "true";
    };
    readonly storage: {
        readonly flag: "MINIO_BUILTIN";
        readonly host: "S3_ENDPOINT";
        readonly profile: "minio";
        readonly selection: "STORAGE_TYPE";
        readonly selected: "s3";
    };
};
export type BuiltInService = keyof typeof SERVICES;
export interface SavedBuiltInMode {
    builtIn: boolean;
    builtInSet: boolean;
}
export declare function effectiveBuiltInFlag(service: BuiltInService, saved: Record<string, string>): boolean;
export declare function savedBuiltInMode(service: BuiltInService, saved: Record<string, string>): SavedBuiltInMode;
export {};
