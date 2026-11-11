import { type Client } from 'whatsapp-web.js';
import { type EngineEventCallbacks, EngineStatus } from '../interfaces/whatsapp-engine.interface';
import { type createLogger } from '../../common/services/logger.service';
import { type WhatsAppWebJsConfig } from './whatsapp-web-js.adapter';
export declare const ONBOARDING_DEFAULT_CONTINUE_LABEL = "Continue";
export declare function resolveOnboardingContinueLabels(): string[];
export declare function probeOnboardingModal(options?: {
    labels?: string[];
    headingOptionalFor?: string[];
}): {
    modalPresent: boolean;
    dismissed: boolean;
};
export declare function collectDialogDiagnostics(): Array<{
    heading: string | null;
    buttons: string[];
}>;
export interface WwebjsOnboardingWatcherHost {
    readonly logger: ReturnType<typeof createLogger>;
    readonly config: WhatsAppWebJsConfig;
    getClient(): Client | null;
    getStatus(): EngineStatus;
    setStatus(status: EngineStatus): void;
    isTearingDown(): boolean;
    isDisconnectReported(): boolean;
    getCallbacks(): EngineEventCallbacks;
}
export declare class WwebjsOnboardingWatcher {
    private readonly host;
    private onboardingWatcherTimer;
    private onboardingWatcherStartedAt;
    private onboardingWatcherStarted;
    private onboardingDismissClicks;
    private onboardingDialogSignatures;
    private onboardingProbes;
    constructor(host: WwebjsOnboardingWatcherHost);
    startOnboardingWatcher(): void;
    clearOnboardingWatcher(): void;
    private dismissOnboardingModalIfNeeded;
    reportActionRequired(reason: string): void;
}
