import { Session } from './entities/session.entity';
export declare class SessionErrorStore {
    private readonly errors;
    set(sessionId: string, reason: string): void;
    get(sessionId: string): string | undefined;
    clear(sessionId: string): void;
    attachTo(session: Session): Session;
}
