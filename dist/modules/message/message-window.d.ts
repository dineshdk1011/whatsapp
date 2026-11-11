import { MessageDirection } from './entities/message.entity';
export interface MessageWindow {
    since?: number;
    until?: number;
    direction?: MessageDirection;
    type?: string;
    messageId?: string;
    orderBy?: 'createdAt' | 'timestamp';
}
export declare function messageTimeBoundarySeconds(milliseconds: number): number;
export declare function validateMessageWindow(window: MessageWindow): void;
export declare function parseMessageWindow(query: {
    since?: string;
    until?: string;
    direction?: string;
    type?: string;
    messageId?: string;
    orderBy?: string;
}): MessageWindow;
