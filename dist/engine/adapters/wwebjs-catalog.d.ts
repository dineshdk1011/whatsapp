import { Catalog, MessageResult, Product, ProductQueryOptions, PaginatedProducts } from '../interfaces/whatsapp-engine.interface';
import { type WwebjsEngineHost } from './wwebjs-host';
export declare class WwebjsCatalog {
    private readonly host;
    constructor(host: WwebjsEngineHost);
    getCatalog(): Promise<Catalog | null>;
    getProducts(_options?: ProductQueryOptions): Promise<PaginatedProducts>;
    getProduct(_productId: string): Promise<Product | null>;
    sendProduct(_chatId: string, _productId: string, _body?: string): Promise<MessageResult>;
    sendCatalog(_chatId: string, _body?: string): Promise<MessageResult>;
}
