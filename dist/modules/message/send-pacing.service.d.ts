import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { Session } from '../session/entities/session.entity';
import { AuditService } from '../audit/audit.service';
export declare const SEND_PACING_LIMITED = "SEND_PACING_LIMITED";
export declare function isPacingLimitedError(error: unknown): boolean;
export declare function countsTowardSendBreaker(error: unknown): boolean;
export declare function sentNothing(error: unknown): boolean;
export interface GroupReachoutReservation {
    coldCount: number;
    dayStartMs: number;
}
export type SettleAdmission = (mayHaveSent?: boolean) => void;
export declare class SendPacingService {
    private readonly messageRepository;
    private readonly sessionRepository;
    private readonly configService?;
    private readonly auditService?;
    private readonly logger;
    private readonly breakers;
    private readonly groupReachoutTally;
    private readonly holds;
    private readonly refusalSamples;
    constructor(messageRepository: Repository<Message>, sessionRepository: Repository<Session>, configService?: ConfigService | undefined, auditService?: AuditService | undefined);
    assertSendAllowed(sessionId: string, chatId?: string, opts?: {
        hold?: boolean;
        untilSettled?: boolean;
        whilePreparing?: boolean;
    }): Promise<SettleAdmission | undefined>;
    private chatReachoutsToday;
    private heldAdmissions;
    assertReachoutAllowed(sessionId: string, contactIds: string[]): Promise<GroupReachoutReservation>;
    refundGroupReachouts(sessionId: string, reservation: GroupReachoutReservation): void;
    private groupReachoutsToday;
    private addGroupReachouts;
    recordSendFailure(sessionId: string): void;
    recordSendSuccess(sessionId: string): void;
    private allowanceForAge;
    private breakerFor;
    private assertBreakerClosed;
    private assertUnderDailyCap;
    private auditRefusal;
    private readColdReachouts;
    private assertUnderColdCap;
    private countColdReachoutsToday;
    private refuse;
}
