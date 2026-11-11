export type UnhandledRejectionKind = 'page_context_lost' | 'other';
export declare function incrementUnhandledRejections(kind: UnhandledRejectionKind): void;
export declare function getUnhandledRejections(): Readonly<Record<UnhandledRejectionKind, number>>;
