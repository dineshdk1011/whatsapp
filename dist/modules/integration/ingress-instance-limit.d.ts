import type { ThrottlerStorage } from '@nestjs/throttler';
export interface IngressAdmission {
    ok: boolean;
    headers: Record<string, string>;
}
export declare function admitIngressInstance(storage: ThrottlerStorage, pluginId: string, instanceId: string, env?: NodeJS.ProcessEnv): Promise<IngressAdmission>;
