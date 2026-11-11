export declare class StatusUpdate {
    id: string;
    sessionId: string;
    contactJid: string;
    contactName?: string;
    contactPushName?: string;
    waStatusId: string;
    type: 'text' | 'image' | 'video' | 'voice';
    caption?: string;
    mediaPath?: string;
    mediaMimetype?: string;
    mediaOmitted: boolean;
    omitReason?: string;
    backgroundColor?: string;
    font?: number;
    postedAt: number;
    expiresAt: number;
}
