export type SecretPayloadKind = 'edit' | 'reaction';
export interface SecretPayloadInput {
    kind: SecretPayloadKind;
    secret: Uint8Array;
    iv: Uint8Array;
    payload: Uint8Array;
    targetId: string;
    targetAuthors: readonly string[];
    modifiers: readonly string[];
}
export declare function decryptSecretPayload(input: SecretPayloadInput): Buffer | undefined;
export declare function bytesOf(value: unknown): Buffer | undefined;
export declare function messageSecretOf(message: unknown): Buffer | undefined;
export declare function withoutDevice(jid: string): string;
export declare function senderForms(key: {
    remoteJid?: string | null;
    remoteJidAlt?: string | null;
    participant?: string | null;
    participantAlt?: string | null;
    fromMe?: boolean | null;
}, own: readonly string[]): string[];
