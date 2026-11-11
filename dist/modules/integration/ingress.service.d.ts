import { PluginIngressRoute } from '../../core/plugins/plugin.interfaces';
import { IngressJobData } from '../queue/processors/ingress.processor';
import type { EngineStatus } from '../../engine/interfaces/whatsapp-engine.interface';
import type { IngressAdmission } from './ingress-instance-limit';
export interface IngressRequest {
    pluginId: string;
    instanceId: string;
    route: string;
    method: string;
    headers: Record<string, string>;
    query: Record<string, string>;
    rawBody: string;
    unparsedBody?: boolean;
}
export interface ResolvedInstance {
    id: string;
    pluginId: string;
    instanceId: string;
    secret: string;
    enabled: boolean;
    sessionScope: string | null;
    verifyToken: string | null;
}
export type IngressRouteDescriptor = PluginIngressRoute & {
    dedupHeader?: string;
};
export interface IngressDeps {
    instances: {
        resolve(pluginId: string, instanceId: string): Promise<ResolvedInstance | null>;
    };
    manifestRoute: (pluginId: string, route: string) => IngressRouteDescriptor | undefined;
    events: {
        recordOrSkip(input: {
            instanceId: string;
            pluginId: string;
            providerDeliveryId: string;
            route: string;
            payload: IngressJobData['payload'] & {
                method?: string;
            };
            payloadHash: string;
            sessionId: string | null;
        }): Promise<boolean>;
    };
    enqueue: (data: IngressJobData, jobId: string) => Promise<unknown>;
    sessionStatus?: (scope: string) => EngineStatus | undefined;
    restorePending?: (pluginId: string) => boolean;
    deferDispatch?: (pluginId: string) => boolean;
    log?: (event: string, meta: Record<string, unknown>) => void;
    admitInstance?: (pluginId: string, instanceId: string) => Promise<IngressAdmission>;
    now: () => number;
}
export declare class IngressService {
    private readonly deps;
    private readonly logger;
    constructor(deps: IngressDeps);
    private readonly warnedMissingCap;
    private fallbackMaxBodyBytes;
    handle(req: IngressRequest): Promise<{
        status: number;
        body?: string;
        headers?: Record<string, string>;
    }>;
}
export declare function extractConversationId(spec: {
    header?: string;
    jsonPointer?: string;
} | undefined, headers: Record<string, string>, rawBody: string): string | undefined;
export declare function redactSensitiveHeaders(headers: Record<string, string>, credentialHeader?: string): Record<string, string>;
