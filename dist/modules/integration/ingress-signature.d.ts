import { IngressSignatureSpec } from '../../core/plugins/plugin.interfaces';
export interface VerifyInput {
    rawBody: string;
    headers: Record<string, string>;
    secret: string;
    now: number;
    instanceId: string;
}
export declare function resolveIngressTimestampToleranceSec(env?: NodeJS.ProcessEnv): number;
export declare function verifyIngressSignature(spec: IngressSignatureSpec, input: VerifyInput): {
    ok: boolean;
    reason?: string;
};
