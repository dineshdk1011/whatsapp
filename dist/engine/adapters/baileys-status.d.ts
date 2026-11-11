import type { WASocket } from '@whiskeysockets/baileys';
import { MediaInput, StatusPostOptions, StatusResult } from '../interfaces/whatsapp-engine.interface';
export interface BaileysStatusHost {
    sessionProxyUrl(): string | undefined;
    ensureReady(): void;
    getSocket(): WASocket;
    getSocketOrNull(): WASocket | null;
    toEngineJid(jid: string): string;
    normalizedSelfJid(): string;
    toUnixSeconds(ts: number | string | {
        toNumber(): number;
    } | null | undefined): number;
    rememberOwnSend(id: string | null | undefined): void;
}
export declare class BaileysStatus {
    private readonly host;
    private readonly audiences;
    constructor(host: BaileysStatusHost);
    private sock;
    private sendStatus;
    postTextStatus(text: string, options: StatusPostOptions): Promise<StatusResult>;
    postImageStatus(media: MediaInput, options: StatusPostOptions): Promise<StatusResult>;
    postVideoStatus(media: MediaInput, options: StatusPostOptions): Promise<StatusResult>;
    postVoiceStatus(media: MediaInput, options: StatusPostOptions): Promise<StatusResult>;
    private postMediaStatus;
    deleteStatus(statusId: string): Promise<void>;
    private postStatus;
    private toStatusResult;
}
