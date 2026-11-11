import type { AccountRestriction } from '../../../engine/interfaces/whatsapp-engine.interface';
export declare enum SessionStatus {
    CREATED = "created",
    INITIALIZING = "initializing",
    QR_READY = "qr_ready",
    AUTHENTICATING = "authenticating",
    READY = "ready",
    DISCONNECTED = "disconnected",
    ACTION_REQUIRED = "action_required",
    FAILED = "failed"
}
export declare class Session {
    id: string;
    name: string;
    status: SessionStatus;
    phone: string | null;
    pushName: string | null;
    config: Record<string, unknown>;
    proxyUrl: string | null;
    proxyType: 'http' | 'https' | 'socks4' | 'socks5' | null;
    connectedAt: Date | null;
    lastActiveAt: Date | null;
    nodeId: string | null;
    claimedAt: Date | null;
    nodeUrl: string | null;
    leaseExpiresAt: Date | null;
    desiredState: 'stopped' | 'deleting' | 'deleting-stopped' | null;
    createdAt: Date;
    updatedAt: Date;
    lastError?: string;
    restriction?: AccountRestriction | null;
}
