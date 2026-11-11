export declare class OwnSendRegistry {
    private readonly cap;
    private readonly ids;
    constructor(cap?: number);
    get size(): number;
    remember(id: string | null | undefined): void;
    consume(id: string | null | undefined): boolean;
}
