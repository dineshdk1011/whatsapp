import { ConfigService } from '@nestjs/config';
export interface FeatureFlags {
    autoStartSessions: boolean;
    storeEphemeralMessages: boolean;
    resolveLidToPhone: boolean;
    simulateTyping: boolean;
    simulateTypingMaxMs: number;
}
export declare function computeFeatureFlags(env?: NodeJS.ProcessEnv): FeatureFlags;
export declare function resolveFeatureFlags(configService?: Pick<ConfigService, 'get'>): FeatureFlags;
