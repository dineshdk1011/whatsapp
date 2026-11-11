import { EngineStatus } from '../../engine/interfaces/whatsapp-engine.interface';
import type { IngressRouteDescriptor } from './ingress.service';
export type PreflightRejection = {
    status: number;
    body: string;
    headers?: Record<string, string>;
};
export declare const pluginRestoringRejection: () => PreflightRejection;
export declare function evaluatePreflight(route: IngressRouteDescriptor, sessionScope: string | null, sessionStatus: ((scope: string) => EngineStatus | undefined) | undefined): PreflightRejection | null;
