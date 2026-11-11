import type { AccountRestriction } from '../../engine/interfaces/whatsapp-engine.interface';
import { Session } from './entities/session.entity';
export declare class SessionRestrictionStore {
    private readonly restrictions;
    constructor();
    set(sessionId: string, restriction: AccountRestriction): boolean;
    private publishCount;
    get(sessionId: string): AccountRestriction | undefined;
    private inForce;
    clear(sessionId: string): AccountRestriction | undefined;
    clearIfDisprovedByReady(sessionId: string): AccountRestriction | undefined;
    size(): number;
    attachTo(session: Session): Session;
}
