export declare const MAX_BODY_NESTING = 100;
export declare const BODY_NESTING_MESSAGE = "Request body must not nest objects or arrays more than 100 levels deep";
export declare const isUtf8Charset: (charset: string) => boolean;
export declare function exceedsJsonNesting(text: Uint8Array): boolean;
export declare const exceedsBodyNesting: (value: unknown, depth?: number) => boolean;
