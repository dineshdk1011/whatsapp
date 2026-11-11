import type { Session } from '../entities/session.entity';
import { SessionStatus } from '../entities/session.entity';
export declare class AccountRestrictionDto {
    kind: 'reachout_timelock' | 'tos_block' | 'proxy_block';
    code: string;
    expiresAt?: Date | null;
}
export declare class SessionResponseDto {
    id: string;
    name: string;
    status: SessionStatus;
    phone?: string | null;
    pushName?: string | null;
    connectedAt?: Date | null;
    lastActive?: Date | null;
    createdAt: Date;
    updatedAt: Date;
    lastError?: string | null;
    restriction?: AccountRestrictionDto | null;
    engineLoaded: boolean;
    static fromEntity(session: Session, engineLoaded: boolean): SessionResponseDto;
}
export declare class QRCodeResponseDto {
    qrCode: string;
    status: SessionStatus;
}
