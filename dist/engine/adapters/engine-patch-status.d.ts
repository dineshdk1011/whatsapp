export type PatchFamily = 'wwebjs' | 'baileys';
export declare function unappliedPatches(family: PatchFamily, scriptsDir?: string, depDir?: string): string[];
export declare function unappliedPatchesMessage(family: PatchFamily, names: string[]): string;
