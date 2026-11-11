import type { IWhatsAppEngine } from './interfaces/whatsapp-engine.interface';
export declare class EngineRegistry {
    private readonly engines;
    private readonly proxies;
    readonly initializing: Set<string>;
    private readonly retireListeners;
    get(id: string): IWhatsAppEngine | undefined;
    set(id: string, engine: IWhatsAppEngine, proxyUrl?: string): void;
    has(id: string): boolean;
    delete(id: string): boolean;
    clear(): void;
    onRetire(listener: (id: string, engine: IWhatsAppEngine) => void): void;
    private retired;
    get size(): number;
    keys(): IterableIterator<string>;
    entries(): Array<[string, IWhatsAppEngine]>;
    [Symbol.iterator](): IterableIterator<[string, IWhatsAppEngine]>;
    isLive(id: string, engine: IWhatsAppEngine): boolean;
    deleteIfLive(id: string, engine: IWhatsAppEngine): boolean;
    proxyUrl(id: string): string | undefined;
    require(id: string, onMissing?: () => Error): IWhatsAppEngine;
    activeIds(): string[];
}
