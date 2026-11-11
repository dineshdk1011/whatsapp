export declare const BLANK_SHADOWED_ENV_KEYS: string[];
export declare function clearBlankEnv(env: NodeJS.ProcessEnv, keys: string[]): void;
export declare function recordOsEnvKeys(env?: NodeJS.ProcessEnv): void;
export declare function isOsProvidedEnv(key: string): boolean;
export declare function recordPinnedEnvKeys(env?: NodeJS.ProcessEnv): void;
export declare function isEnvPinned(key: string): boolean;
