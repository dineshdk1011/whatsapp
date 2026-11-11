import { type Message } from 'whatsapp-web.js';
import { MediaInput, Status, StatusPostOptions, StatusResult } from '../interfaces/whatsapp-engine.interface';
import { type WwebjsEngineHost } from './wwebjs-host';
export declare function toStatusResult(msg: Message | undefined): StatusResult;
export declare class WwebjsStatus {
    private readonly host;
    constructor(host: WwebjsEngineHost);
    private client;
    private withPage;
    getContactStatuses(): Promise<Status[]>;
    getContactStatus(contactId: string): Promise<Status[]>;
    private collectStatuses;
    private warnedStatusRecipients;
    postTextStatus(text: string, options: StatusPostOptions): Promise<StatusResult>;
    postImageStatus(media: MediaInput, options: StatusPostOptions): Promise<StatusResult>;
    postVideoStatus(media: MediaInput, options: StatusPostOptions): Promise<StatusResult>;
    postVoiceStatus(media: MediaInput, options: StatusPostOptions): Promise<StatusResult>;
    private postMediaStatus;
    private warnStatusRecipientsOnce;
    deleteStatus(statusId: string): Promise<void>;
}
