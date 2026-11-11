import { Contact } from '../interfaces/whatsapp-engine.interface';
import { type SerializedWid } from '../types/whatsapp-web-js.types';
import { type WwebjsEngineHost } from './wwebjs-host';
interface LeanContact {
    id: SerializedWid | string;
    name?: string;
    pushname?: string;
    number: string;
    isMyContact: boolean;
    isBlocked: boolean;
}
interface LeanContactRead {
    rows: LeanContact[];
    failed: number;
    firstError?: string;
}
export declare function readLeanContacts(): Promise<LeanContactRead>;
export declare function readCurrentLid(phoneId: string): string | null;
export declare class WwebjsContacts {
    private readonly host;
    constructor(host: WwebjsEngineHost);
    private client;
    private toContact;
    private static mergeById;
    getContacts(): Promise<Contact[]>;
    getContactById(contactId: string): Promise<Contact | null>;
    lookupNumberId(number: string): Promise<string | null>;
    getNumberId(number: string): Promise<string | null>;
    checkNumberExists(number: string): Promise<boolean>;
    resolveContactPhone(contactId: string): Promise<string | null>;
    upsertContact(contactId: string, firstName: string, lastName?: string): Promise<void>;
    deleteContact(contactId: string): Promise<void>;
    blockContact(contactId: string): Promise<void>;
    getBlockedContacts(): Promise<string[]>;
    unblockContact(contactId: string): Promise<void>;
    getProfilePicture(contactId: string): Promise<string | null>;
    private profilePictureByLid;
}
export {};
