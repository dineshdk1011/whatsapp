export type WaIdKind = 'user' | 'group' | 'lid' | 'status' | 'newsletter' | 'broadcast' | 'unknown';
export interface ParsedWaId {
    kind: WaIdKind;
    userPart: string;
    device?: string;
    raw: string;
}
export declare function userPart(jid: string): string;
export declare function parseWaId(jid: string): ParsedWaId;
export declare function isIndividualWid(value: string): boolean;
export declare function isAddressableParticipant(value: string): boolean;
export declare function toParticipantWid(value: string): string;
export declare function toNeutralJid(jid: string, resolvePhone?: (jid: string) => string | null): string;
export declare function isChannelJid(jid: string): boolean;
export type ChatKind = 'individual' | 'group' | 'channel' | 'status' | 'broadcast' | 'unknown';
export declare function chatKind(jid: string): ChatKind;
