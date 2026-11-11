import { CallLinkType, MediaInput } from '../interfaces/whatsapp-engine.interface';
import { type WwebjsEngineHost } from './wwebjs-host';
export declare class WwebjsProfile {
    private readonly host;
    constructor(host: WwebjsEngineHost);
    private client;
    private withPage;
    createCallLink(type: CallLinkType, startTime: number): Promise<string>;
    deleteProfilePicture(): Promise<void>;
    setProfileName(name: string): Promise<void>;
    setProfileStatus(status: string): Promise<void>;
    setProfilePicture(media: MediaInput): Promise<void>;
}
