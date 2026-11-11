export interface ContactDirectory {
    resolveLid(lid: string): string | null | undefined | Promise<string | null | undefined>;
    lidsForPhone(phone: string): string[] | Promise<string[]>;
}
export declare function resolveJidCandidates(value: string, directory?: ContactDirectory): Promise<string[]>;
