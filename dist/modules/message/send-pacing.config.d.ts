import { ConfigService } from '@nestjs/config';
export interface SendPacingConfig {
    enabled: boolean;
    warmupSchedule: number[];
    coldSchedule: number[];
    breakerThreshold: number;
    breakerCooldownMs: number;
}
export declare function computeSendPacingConfig(env?: NodeJS.ProcessEnv): SendPacingConfig;
export declare function resolveSendPacingConfig(configService?: Pick<ConfigService, 'get'>): SendPacingConfig;
