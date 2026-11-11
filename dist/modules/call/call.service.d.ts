import { EngineRegistry } from '../../engine/engine-registry.service';
import { CallLinkType } from '../../engine/interfaces/whatsapp-engine.interface';
export declare class CallService {
    private readonly engines;
    constructor(engines: EngineRegistry);
    private getEngine;
    rejectCall(sessionId: string, callId: string): Promise<void>;
    createCallLink(sessionId: string, type: CallLinkType, startTime: number): Promise<string>;
}
