import { type Client } from 'whatsapp-web.js';
import { type EngineEventCallbacks, EngineStatus } from '../interfaces/whatsapp-engine.interface';
import { type createLogger } from '../../common/services/logger.service';
import { type WhatsAppWebJsConfig } from './whatsapp-web-js.adapter';
export interface WwebjsStuckAuthHost {
    readonly logger: ReturnType<typeof createLogger>;
    readonly config: WhatsAppWebJsConfig;
    getClient(): Client | null;
    setClient(client: Client | null): void;
    setStatus(status: EngineStatus): void;
    getCallbacks(): EngineEventCallbacks;
}
export declare class WwebjsStuckAuth {
    private readonly host;
    private recoveryAttempted;
    constructor(host: WwebjsStuckAuthHost);
    recoverFromStuckAuth(): Promise<void>;
    clearLocalAuth(): Promise<void>;
}
