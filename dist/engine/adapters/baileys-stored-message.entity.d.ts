import { Session } from '../../modules/session/entities/session.entity';
export declare class BaileysStoredMessage {
    id: string;
    sessionId: string;
    session?: Session;
    waMessageId: string;
    serializedMessage: string;
    createdAt: Date;
}
