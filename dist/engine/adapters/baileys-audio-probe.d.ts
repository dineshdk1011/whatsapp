export interface AudioDescription {
    seconds: number;
    waveform?: Uint8Array;
}
export declare const WAVEFORM_BARS = 64;
export declare function describeAudio(data: Buffer, ptt: boolean): Promise<AudioDescription>;
