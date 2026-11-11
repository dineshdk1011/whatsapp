import type { ParticipantPresence, PresenceUpdateEvent } from '../../engine/interfaces/whatsapp-engine.interface';
export interface ChatPresence {
    chatId: string;
    participants: ParticipantPresence[];
    groupOnlineCount?: number;
    observedAt: number;
}
export declare class PresenceStore {
    private readonly bySession;
    private readonly ownIntent;
    setOwnIntent(sessionId: string, available: boolean): void;
    getOwnIntent(sessionId: string): boolean | undefined;
    record(sessionId: string, event: PresenceUpdateEvent, at?: number): boolean;
    get(sessionId: string, chatId: string): ChatPresence | null;
    clear(sessionId: string): void;
}
