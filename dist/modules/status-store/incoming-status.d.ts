import type { IncomingMessage } from '../../engine/interfaces/whatsapp-engine.interface';
export interface IncomingStatus {
    waStatusId: string;
    contactJid: string;
    contactName?: string;
    contactPushName?: string;
    type: 'text' | 'image' | 'video' | 'voice';
    caption?: string;
    backgroundColor?: string;
    font?: number;
    media?: {
        mimetype: string;
        data?: string;
        omitted?: boolean;
        sizeBytes?: number;
    };
    postedAt: number;
}
export declare function buildIncomingStatus(msg: IncomingMessage): IncomingStatus | null;
