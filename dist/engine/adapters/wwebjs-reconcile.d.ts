import { type Client } from 'whatsapp-web.js';
import { type EngineEventCallbacks, EngineStatus } from '../interfaces/whatsapp-engine.interface';
import { type createLogger } from '../../common/services/logger.service';
import { type WhatsAppWebJsConfig } from './whatsapp-web-js.adapter';
export interface WwebjsReadyReconcileHost {
    readonly logger: ReturnType<typeof createLogger>;
    readonly config: WhatsAppWebJsConfig;
    getClient(): Client | null;
    getStatus(): EngineStatus;
    setStatus(status: EngineStatus): void;
    getCallbacks(): EngineEventCallbacks;
    markReadyFromClientInfo(): void;
    wasFreshPairing(): boolean;
    recoverFromStuckAuth(): Promise<void>;
}
export declare const READY_RECONCILE_TIMEOUT_MS = 90000;
export declare const READY_RECONCILE_BRIDGE_RELOAD_GRACE_MS = 45000;
export declare class WwebjsReadyReconcile {
    private readonly host;
    private readyReconcileTimer;
    private readyReconcileStartedAt;
    private readyReconcileProbeInFlight;
    private lastProbeStateConnected;
    private readyReconcileReloadAttempted;
    constructor(host: WwebjsReadyReconcileHost);
    scheduleReadyReconcile(): void;
    clearReadyReconcile(): void;
    private client;
    private isClientRuntimeReady;
    private maybeReloadDeadBridge;
}
