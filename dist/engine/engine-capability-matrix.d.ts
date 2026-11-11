export type CapabilityStatus = 'supported' | 'not-available';
export type RootCause = 'adapter-gap' | 'library-limitation' | 'uncertain';
export interface AdapterCapability {
    status: CapabilityStatus;
    rootCause?: RootCause;
}
export interface MethodCapability {
    wwjs: AdapterCapability;
    baileys: AdapterCapability;
    evidence?: string;
}
export declare const CURATED_CAPABILITY_EXCEPTIONS: Record<string, MethodCapability>;
export declare function engineCapabilityMatrix(): Record<string, MethodCapability>;
