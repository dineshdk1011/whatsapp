import type { Request, Response } from 'express';
import { IngressService } from './ingress.service';
export declare class IngressController {
    private readonly ingress;
    constructor(ingress: IngressService);
    receive(pluginId: string, instanceId: string, query: Record<string, string>, req: Request & {
        rawBody?: Buffer;
    }, res: Response): Promise<void>;
}
