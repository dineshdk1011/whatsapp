import { Session } from '../../session/entities/session.entity';
export declare class Template {
    id: string;
    sessionId: string;
    session: Session;
    name: string;
    body: string;
    header: string | null;
    footer: string | null;
    createdAt: Date;
    updatedAt: Date;
}
